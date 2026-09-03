using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Models;
using HR.Application.Reports.Dtos;
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

namespace HR.IntegrationTests.Reports;

public class ReportsControllerIntegrationTests : IClassFixture<ReportsControllerIntegrationTests.MySqlFixture>
{
    private readonly MySqlFixture _fixture;
    private readonly HttpClient _client;

    public ReportsControllerIntegrationTests(MySqlFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.CreateClient();
    }

    [Fact]
    public async Task GetEmployerSummary_WithoutDateRange_ShouldReturnDefault30DaysData()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.JobViewLogs.RemoveRange(db.JobViewLogs);
            db.Applications.RemoveRange(db.Applications);
            db.Jobs.RemoveRange(db.Jobs);
            db.Employers.RemoveRange(db.Employers);
            await db.SaveChangesAsync();

            var employer = new Employer { Id = 10, UserId = 1, CompanyId = 100, Position = "HR" };
            db.Employers.Add(employer);

            var job = new Job
            {
                Id = 1,
                CompanyId = 100,
                EmployerId = 10,
                Title = "Integration Job",
                Description = "Description text that is sufficiently long enough to pass validation.",
                Requirements = "Requirements text that is sufficiently long enough.",
                City = "Hà Nội",
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.Today.AddDays(30),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            db.Jobs.Add(job);

            var viewLog = new JobViewLog
            {
                Id = 1,
                JobId = 1,
                IpAddress = "127.0.0.1",
                ViewedAt = DateTime.Today.AddDays(-5)
            };
            db.JobViewLogs.Add(viewLog);

            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/reports/employer/summary");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<EmployerSummaryDto>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.TotalViews.Should().Be(1);
    }

    [Fact]
    public async Task GetEmployerSummary_WhenSuccessful_ShouldReturn200OK()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.JobViewLogs.RemoveRange(db.JobViewLogs);
            db.Applications.RemoveRange(db.Applications);
            db.Jobs.RemoveRange(db.Jobs);
            db.Employers.RemoveRange(db.Employers);
            await db.SaveChangesAsync();

            var employer = new Employer { Id = 10, UserId = 1, CompanyId = 100, Position = "HR" };
            db.Employers.Add(employer);

            var job = new Job
            {
                Id = 1,
                CompanyId = 100,
                EmployerId = 10,
                Title = "Integration Job 2",
                Description = "Description text that is sufficiently long enough to pass validation.",
                Requirements = "Requirements text that is sufficiently long enough.",
                City = "Hà Nội",
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.Today.AddDays(30),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            db.Jobs.Add(job);

            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/reports/employer/summary?from=2026-08-01&to=2026-08-31");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<EmployerSummaryDto>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
    }

    public class MySqlFixture : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly MySqlContainer _mysqlContainer = new MySqlBuilder()
            .WithDatabase("hr_test_reports_db")
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
                mockCurrentUserService.Username.Returns("test_employer_1");
                mockCurrentUserService.HasPermission(Arg.Any<string>()).Returns(true);

                services.AddSingleton(mockCurrentUserService);
            });
        }
    }
}
