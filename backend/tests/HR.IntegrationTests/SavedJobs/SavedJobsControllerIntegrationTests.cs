using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Models;
using HR.Application.SavedJobs.Dtos;
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

namespace HR.IntegrationTests.SavedJobs;

public class SavedJobsControllerIntegrationTests : IClassFixture<SavedJobsControllerIntegrationTests.MySqlFixture>
{
    private readonly MySqlFixture _fixture;
    private readonly HttpClient _client;

    public SavedJobsControllerIntegrationTests(MySqlFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.CreateClient();
    }

    [Fact]
    public async Task ToggleSave_NonExistentJob_ShouldReturn404NotFound()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            var existingJob = await db.Jobs.FindAsync(99999);
            if (existingJob != null)
            {
                db.Jobs.Remove(existingJob);
                await db.SaveChangesAsync();
            }
        }

        // Act
        var response = await _client.PostAsync("/api/v1/jobs/99999/save", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetSavedJobs_WithExpiredJob_ShouldReturn200OKAndStatusExpired()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.SavedJobs.RemoveRange(db.SavedJobs);
            db.Jobs.RemoveRange(db.Jobs);
            db.Companies.RemoveRange(db.Companies);
            db.Candidates.RemoveRange(db.Candidates);
            await db.SaveChangesAsync();

            var candidate = new Candidate { Id = 1, FullName = "Test Candidate" };
            db.Candidates.Add(candidate);

            var company = new Company { Id = 1, Name = "Test Company", Industry = "IT", SizeRange = "10-50" };
            db.Companies.Add(company);

            var job = new Job
            {
                Id = 1,
                CompanyId = 1,
                EmployerId = 1,
                Title = "Expired Dev Position",
                Description = "A valid test description for a job listing.",
                Requirements = "A valid requirement list.",
                City = "Hà Nội",
                Status = JobStatus.EXPIRED,
                ExpiredAt = DateTime.Today.AddDays(-5),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            db.Jobs.Add(job);

            var savedJob = new SavedJob
            {
                CandidateId = 1,
                JobId = 1,
                SavedAt = DateTime.Now
            };
            db.SavedJobs.Add(savedJob);

            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/jobs/saved");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<SavedJobDto>>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Items.Should().HaveCount(1);
        result.Data.Items[0].JobStatus.Should().Be("EXPIRED");
    }

    public class MySqlFixture : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly MySqlContainer _mysqlContainer = new MySqlBuilder()
            .WithDatabase("hr_test_saved_jobs_db")
            .WithUsername("test_user")
            .WithPassword("test_password")
            .Build();

        public async Task InitializeAsync()
        {
            await _mysqlContainer.StartAsync();

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
                var descriptor = services.First(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                services.Remove(descriptor);

                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseMySql(_mysqlContainer.GetConnectionString(), ServerVersion.AutoDetect(_mysqlContainer.GetConnectionString()));
                });

                var currentUserServiceDescriptor = services.First(d => d.ServiceType == typeof(ICurrentUserService));
                services.Remove(currentUserServiceDescriptor);

                var mockCurrentUserService = Substitute.For<ICurrentUserService>();
                mockCurrentUserService.UserId.Returns(1);
                mockCurrentUserService.Username.Returns("test_candidate_1");
                mockCurrentUserService.HasPermission(Arg.Any<string>()).Returns(true);

                services.AddSingleton(mockCurrentUserService);
            });
        }
    }
}
