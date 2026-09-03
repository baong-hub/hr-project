using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Companies.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Testcontainers.MySql;
using Xunit;

namespace HR.IntegrationTests.Companies;

public class CompaniesControllerIntegrationTests : IClassFixture<CompaniesControllerIntegrationTests.MySqlFixture>
{
    private readonly MySqlFixture _fixture;
    private readonly HttpClient _client;

    public CompaniesControllerIntegrationTests(MySqlFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.CreateClient();
    }

    [Fact]
    public async Task Get_WhenSearchByName_ShouldReturn200OkWithMatchingCompanies()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Clean database tables
            db.CandidateFollows.RemoveRange(db.CandidateFollows);
            db.Companies.RemoveRange(db.Companies);
            await db.SaveChangesAsync();

            var company1 = new Company
            {
                Id = 10,
                Name = "FPT Software",
                Address = "Hà Nội",
                Industry = "Công nghệ thông tin",
                SizeRange = "1000+",
                VerificationStatus = CompanyVerificationStatus.VERIFIED
            };

            var company2 = new Company
            {
                Id = 20,
                Name = "Viettel Group",
                Address = "Hà Nội",
                Industry = "Công nghệ thông tin",
                SizeRange = "1000+",
                VerificationStatus = CompanyVerificationStatus.VERIFIED
            };

            db.Companies.AddRange(company1, company2);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/companies?search=FPT");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<CompanyDto>>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().NotBeNull();
        apiResult.Data!.Items.Should().ContainSingle();
        apiResult.Data.Items[0].Name.Should().Be("FPT Software");
    }

    [Fact]
    public async Task PostFollow_WhenAnonymousUser_ShouldReturn403ForbiddenOr401Unauthorized()
    {
        // Arrange
        // Mock anonymous state (UserId = 0)
        _fixture.CurrentUserServiceMock.UserId.Returns(0);
        _fixture.CurrentUserServiceMock.HasPermission(Arg.Any<string>()).Returns(false);

        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.CandidateFollows.RemoveRange(db.CandidateFollows);
            db.Companies.RemoveRange(db.Companies);
            await db.SaveChangesAsync();

            var company = new Company
            {
                Id = 30,
                Name = "Mock Corp",
                Address = "HCM",
                Industry = "Education",
                SizeRange = "10-50",
                VerificationStatus = CompanyVerificationStatus.VERIFIED
            };

            db.Companies.Add(company);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.PostAsync("/api/v1/companies/30/follow", null);

        // Assert
        // Since ICurrentUserService.UserId = 0 causes a ForbiddenException in Handler, 
        // our middleware translates this to 403 Forbidden or 401 depending on standard settings.
        response.StatusCode.Should().Match(code => 
            code == HttpStatusCode.Unauthorized || code == HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task PostFollow_WhenAuthenticatedCandidate_ShouldToggleFollowAndReturn200Ok()
    {
        // Arrange
        var candidateId = 50;
        _fixture.CurrentUserServiceMock.UserId.Returns(candidateId);
        _fixture.CurrentUserServiceMock.HasPermission(Arg.Any<string>()).Returns(true);

        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.CandidateFollows.RemoveRange(db.CandidateFollows);
            db.Companies.RemoveRange(db.Companies);
            await db.SaveChangesAsync();

            var company = new Company
            {
                Id = 40,
                Name = "Follow Target Corp",
                Address = "HCM",
                Industry = "Marketing",
                SizeRange = "50-100",
                VerificationStatus = CompanyVerificationStatus.VERIFIED
            };

            db.Companies.Add(company);
            await db.SaveChangesAsync();
        }

        // Act - Call 1 (Follow)
        var response1 = await _client.PostAsync("/api/v1/companies/40/follow", null);

        // Assert 1
        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        var result1 = await response1.Content.ReadFromJsonAsync<ApiResponse<FollowResultDto>>();
        result1.Should().NotBeNull();
        result1!.Success.Should().BeTrue();
        result1.Data!.IsFollowing.Should().BeTrue();
        result1.Data.FollowersCount.Should().Be(1);

        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasFollow = await db.CandidateFollows.AnyAsync(cf => cf.CandidateId == candidateId && cf.CompanyId == 40);
            hasFollow.Should().BeTrue();
        }

        // Act - Call 2 (Toggle Unfollow)
        var response2 = await _client.PostAsync("/api/v1/companies/40/follow", null);

        // Assert 2
        response2.StatusCode.Should().Be(HttpStatusCode.OK);
        var result2 = await response2.Content.ReadFromJsonAsync<ApiResponse<FollowResultDto>>();
        result2.Should().NotBeNull();
        result2!.Success.Should().BeTrue();
        result2.Data!.IsFollowing.Should().BeFalse();
        result2.Data.FollowersCount.Should().Be(0);

        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasFollow = await db.CandidateFollows.AnyAsync(cf => cf.CandidateId == candidateId && cf.CompanyId == 40);
            hasFollow.Should().BeFalse();
        }
    }

    public class MySqlFixture : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly MySqlContainer _mysqlContainer = new MySqlBuilder()
            .WithDatabase("hr_integration_test_db")
            .WithUsername("test_user_comp")
            .WithPassword("test_password_comp")
            .Build();

        public ICurrentUserService CurrentUserServiceMock { get; } = Substitute.For<ICurrentUserService>();

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

                services.AddSingleton(CurrentUserServiceMock);
            });
        }
    }
}
