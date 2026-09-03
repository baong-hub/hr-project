using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Models;
using HR.Application.Applications;
using HR.Application.Applications.Commands.SubmitApplication;
using HR.Application.Applications.Commands.ChangeApplicationStatus;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.MySql;
using Xunit;
using HR.Application.Common.Interfaces;
using NSubstitute;

namespace HR.IntegrationTests.Applications;

public class ApplicationsControllerIntegrationTests : IClassFixture<ApplicationsControllerIntegrationTests.MySqlFixture>
{
    private readonly MySqlFixture _fixture;
    private readonly HttpClient _client;

    public ApplicationsControllerIntegrationTests(MySqlFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.CreateClient();
    }

    [Fact]
    public async Task Post_WhenValidRequest_ShouldReturn201Created()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            // Clear existing data
            db.Applications.RemoveRange(db.Applications);
            db.Jobs.RemoveRange(db.Jobs);
            db.Candidates.RemoveRange(db.Candidates);
            db.Companies.RemoveRange(db.Companies);
            await db.SaveChangesAsync();

            // Seed Company & Job
            var company = new Company { Id = 1, Code = "C1", Name = "Job Provider", IsVerified = true };
            var job = new Job 
            { 
                Id = 10, 
                CompanyId = 1, 
                EmployerId = 10, 
                Title = "Integration Test Dev", 
                Status = JobStatus.PUBLISHED, 
                ExpiredAt = DateTime.Today.AddDays(10),
                Description = "Sufficiently long description text that is required for integration testing.",
                Requirements = "Sufficiently long requirements text that is required for integration testing."
            };

            // Seed Candidate & CandidateCv (Matches test user UserId = 1)
            var candidate = new Candidate { Id = 1, UserId = 1, VisibilityStatus = CandidateVisibilityStatus.PUBLIC };
            var cv = new CandidateCv { Id = 100, CandidateId = 1, CvTitle = "Test CV", FileUrl = "http://localhost/test.pdf" };

            db.Companies.Add(company);
            db.Jobs.Add(job);
            db.Candidates.Add(candidate);
            db.CandidateCvs.Add(cv);
            await db.SaveChangesAsync();
        }

        var command = new SubmitApplicationCommand(JobId: 10, CandidateCvId: 100, CoverLetter: "I would love to join!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/applications", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<ApplicationDto>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().NotBeNull();
        apiResult.Data!.JobId.Should().Be(10);
        apiResult.Data.CandidateCvId.Should().Be(100);
        apiResult.Data.Status.Should().Be(ApplicationStatus.APPLIED.ToString());
    }

    [Fact]
    public async Task Patch_WhenOwnerEmployerUpdates_ShouldReturn200Ok()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            // Clear existing data
            db.Applications.RemoveRange(db.Applications);
            db.Jobs.RemoveRange(db.Jobs);
            db.Employers.RemoveRange(db.Employers);
            db.Companies.RemoveRange(db.Companies);
            await db.SaveChangesAsync();

            // Seed Employer & Company (Matches current test user UserId = 1)
            var company = new Company { Id = 1, Code = "C1", Name = "Job Provider", IsVerified = true };
            var employer = new Employer { Id = 20, UserId = 1, CompanyId = 1, Position = "HR" }; // UserId = 1

            // Seed Job owned by Employer 20
            var job = new Job 
            { 
                Id = 20, 
                CompanyId = 1, 
                EmployerId = 20, 
                Title = "Integration Test Dev", 
                Status = JobStatus.PUBLISHED, 
                ExpiredAt = DateTime.Today.AddDays(10),
                Description = "Sufficiently long description text that is required for integration testing.",
                Requirements = "Sufficiently long requirements text that is required for integration testing."
            };

            // Seed Candidate & Application
            var candidate = new Candidate { Id = 2, UserId = 2, VisibilityStatus = CandidateVisibilityStatus.PUBLIC };
            var app = new HR.Domain.Entities.Application
            {
                Id = 50,
                JobId = 20,
                CandidateId = 2,
                CandidateCvId = 1,
                Status = ApplicationStatus.APPLIED
            };

            db.Companies.Add(company);
            db.Employers.Add(employer);
            db.Jobs.Add(job);
            db.Candidates.Add(candidate);
            db.Applications.Add(app);
            await db.SaveChangesAsync();
        }

        var command = new ChangeApplicationStatusDto("SCREENING");

        // Act
        var response = await _client.PatchAsJsonAsync("/api/v1/applications/50/status", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().BeTrue();
    }

    [Fact]
    public async Task Patch_WhenNonOwnerEmployerUpdates_ShouldReturn403Forbidden()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            // Clear existing data
            db.Applications.RemoveRange(db.Applications);
            db.Jobs.RemoveRange(db.Jobs);
            db.Employers.RemoveRange(db.Employers);
            db.Companies.RemoveRange(db.Companies);
            await db.SaveChangesAsync();

            // Seed Employer & Company 1 (Matches current test user UserId = 1)
            var company1 = new Company { Id = 1, Code = "C1", Name = "Job Provider", IsVerified = true };
            var employer1 = new Employer { Id = 20, UserId = 1, CompanyId = 1, Position = "HR" }; // UserId = 1

            // Seed Employer & Company 2 (Owner of the job)
            var company2 = new Company { Id = 2, Code = "C2", Name = "Other Corp", IsVerified = true };
            var employer2 = new Employer { Id = 30, UserId = 3, CompanyId = 2, Position = "HR" }; // Owner of Job

            // Seed Job owned by Employer 30 (Company 2)
            var job = new Job 
            { 
                Id = 30, 
                CompanyId = 2, 
                EmployerId = 30, 
                Title = "Other Job", 
                Status = JobStatus.PUBLISHED, 
                ExpiredAt = DateTime.Today.AddDays(10),
                Description = "Sufficiently long description text that is required for integration testing.",
                Requirements = "Sufficiently long requirements text that is required for integration testing."
            };

            // Seed Candidate & Application
            var candidate = new Candidate { Id = 2, UserId = 2, VisibilityStatus = CandidateVisibilityStatus.PUBLIC };
            var app = new HR.Domain.Entities.Application
            {
                Id = 60,
                JobId = 30,
                CandidateId = 2,
                CandidateCvId = 1,
                Status = ApplicationStatus.APPLIED
            };

            db.Companies.AddRange(company1, company2);
            db.Employers.AddRange(employer1, employer2);
            db.Jobs.Add(job);
            db.Candidates.Add(candidate);
            db.Applications.Add(app);
            await db.SaveChangesAsync();
        }

        var command = new ChangeApplicationStatusDto("SCREENING");

        // Act
        var response = await _client.PatchAsJsonAsync("/api/v1/applications/60/status", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    public class MySqlFixture : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly MySqlContainer _mysqlContainer = new MySqlBuilder()
            .WithDatabase("hr_test_db")
            .WithUsername("test_user")
            .WithPassword("test_password")
            .Build();

        public async Task InitializeAsync()
        {
            await _mysqlContainer.StartAsync();
            
            // Run migrations to prepare db schema
            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Database.MigrateAsync();
        }

        public new async Task DisposeAsync()
        {
            await _mysqlContainer.StopAsync();
            await _mysqlContainer.DisposeAsync();
        }

        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DB context options
                var descriptor = services.First(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                services.Remove(descriptor);

                // Add DB context using MySQL Testcontainers connection string
                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseMySql(_mysqlContainer.GetConnectionString(), ServerVersion.AutoDetect(_mysqlContainer.GetConnectionString()));
                });

                // Mock active user service for authorization bypass in integration tests
                var currentUserServiceDescriptor = services.First(d => d.ServiceType == typeof(ICurrentUserService));
                services.Remove(currentUserServiceDescriptor);

                var mockCurrentUserService = Substitute.For<ICurrentUserService>();
                mockCurrentUserService.UserId.Returns(1); // Matches test candidate (UserId = 1) and employer (UserId = 1)
                mockCurrentUserService.Username.Returns("test_user");
                mockCurrentUserService.HasPermission(Arg.Any<string>()).Returns(true);

                services.AddSingleton(mockCurrentUserService);
            });
        }
    }
}
