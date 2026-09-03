using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Models;
using HR.Application.Jobs.Commands.CreateJob;
using HR.Application.Jobs.Dtos;
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

namespace HR.IntegrationTests.Jobs;

public class JobsControllerIntegrationTests : IClassFixture<JobsControllerIntegrationTests.MySqlFixture>
{
    private readonly MySqlFixture _fixture;
    private readonly HttpClient _client;

    public JobsControllerIntegrationTests(MySqlFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.CreateClient();
    }

    [Fact]
    public async Task Post_WhenActiveEmployer_ShouldReturn201Created()
    {
        // Arrange
        // Seed employer & company
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            // Clear existing
            db.Jobs.RemoveRange(db.Jobs);
            db.Employers.RemoveRange(db.Employers);
            db.Companies.RemoveRange(db.Companies);
            await db.SaveChangesAsync();

            var company = new Company
            {
                Id = 100,
                Code = "COMP1",
                Name = "Big Corp",
                IsVerified = true // Verified [BR-03]
            };
            var employer = new Employer
            {
                Id = 100,
                UserId = 1, // Matches current test user id
                CompanyId = 100,
                Company = company,
                Position = "HR Manager"
            };

            db.Companies.Add(company);
            db.Employers.Add(employer);
            await db.SaveChangesAsync();
        }

        var command = new CreateJobCommand(
            Title: "Integration Test Backend Developer",
            Description: "Integration test description field with at least fifty characters long.",
            Requirements: "Integration test requirements field with at least fifty characters long.",
            Benefits: "Standard lunch and health insurance.",
            SalaryFrom: 20000000,
            SalaryTo: 30000000,
            City: "Hà Nội",
            ExpiredAt: DateTime.Today.AddDays(30)
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/jobs", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<JobDto>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().NotBeNull();
        apiResult.Data!.Title.Should().Be("Integration Test Backend Developer");
        apiResult.Data.Status.Should().Be(JobStatus.PENDING_REVIEW.ToString());
    }

    [Fact]
    public async Task Get_WhenCandidateSearch_ShouldReturnOnlyPublishedJobs()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Clear existing
            db.Jobs.RemoveRange(db.Jobs);
            db.Employers.RemoveRange(db.Employers);
            db.Companies.RemoveRange(db.Companies);
            await db.SaveChangesAsync();

            var company = new Company { Id = 200, Code = "COMP2", Name = "Medium Corp", IsVerified = true };
            var employer = new Employer { Id = 200, UserId = 2, CompanyId = 200, Company = company, Position = "HR" };
            
            // 1. Published and not expired [BR-04]
            var job1 = new Job
            {
                Id = 201,
                CompanyId = 200,
                EmployerId = 200,
                Title = "Published Job",
                Description = "A description that is sufficiently long.",
                Requirements = "Requirements that are sufficiently long.",
                City = "Hà Nội",
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.Today.AddDays(15),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // 2. Pending review (should not be returned)
            var job2 = new Job
            {
                Id = 202,
                CompanyId = 200,
                EmployerId = 200,
                Title = "Pending Job",
                Description = "A description that is sufficiently long.",
                Requirements = "Requirements that are sufficiently long.",
                City = "Hà Nội",
                Status = JobStatus.PENDING_REVIEW,
                ExpiredAt = DateTime.Today.AddDays(15),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // 3. Expired job (should not be returned)
            var job3 = new Job
            {
                Id = 203,
                CompanyId = 200,
                EmployerId = 200,
                Title = "Expired Job",
                Description = "A description that is sufficiently long.",
                Requirements = "Requirements that are sufficiently long.",
                City = "Hà Nội",
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.Today.AddDays(-1), // Expired
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            db.Companies.Add(company);
            db.Employers.Add(employer);
            db.Jobs.AddRange(job1, job2, job3);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/jobs");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<JobDto>>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().NotBeNull();
        apiResult.Data!.Items.Should().ContainSingle();
        apiResult.Data.Items[0].Title.Should().Be("Published Job");
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
                mockCurrentUserService.UserId.Returns(1);
                mockCurrentUserService.Username.Returns("employer_test");
                mockCurrentUserService.HasPermission(Arg.Any<string>()).Returns(true);

                services.AddSingleton(mockCurrentUserService);
            });
        }
    }
}
