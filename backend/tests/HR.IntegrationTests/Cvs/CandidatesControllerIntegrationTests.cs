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
using HR.Application.Cvs.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Testcontainers.MySql;
using Xunit;

namespace HR.IntegrationTests.Cvs;

public class CandidatesControllerIntegrationTests : IClassFixture<CandidatesControllerIntegrationTests.MySqlFixture>
{
    private readonly MySqlFixture _fixture;
    private readonly HttpClient _client;

    public CandidatesControllerIntegrationTests(MySqlFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.CreateClient();
    }

    [Fact]
    public async Task GetCandidates_WhenSearchAsEmployer_ShouldOnlyReturnPublicCandidates()
    {
        // Arrange
        // Mock Employer search role authorization permissions
        _fixture.CurrentUserServiceMock.UserId.Returns(50);
        _fixture.CurrentUserServiceMock.HasPermission("cv:search").Returns(true);

        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Clean previous records to prevent leaks
            db.CandidateSkills.RemoveRange(db.CandidateSkills);
            db.Skills.RemoveRange(db.Skills);
            db.CandidateCvs.RemoveRange(db.CandidateCvs);
            db.Candidates.RemoveRange(db.Candidates);
            db.Users.RemoveRange(db.Users);
            await db.SaveChangesAsync();

            // Create 2 users for candidates
            var user1 = new User { Id = 101, Username = "candidate1", Email = "cand1@example.com" };
            var user2 = new User { Id = 102, Username = "candidate2", Email = "cand2@example.com" };
            db.Users.AddRange(user1, user2);
            await db.SaveChangesAsync();

            // Create 1 PUBLIC and 1 PRIVATE candidates
            var publicCandidate = new Candidate
            {
                Id = 101,
                UserId = 101,
                FullName = "Public Candidate A",
                VisibilityStatus = CandidateVisibilityStatus.PUBLIC
            };

            var privateCandidate = new Candidate
            {
                Id = 102,
                UserId = 102,
                FullName = "Private Candidate B",
                VisibilityStatus = CandidateVisibilityStatus.PRIVATE
            };

            db.Candidates.AddRange(publicCandidate, privateCandidate);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/candidates?search=Candidate");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<List<CandidateProfileDto>>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().NotBeNull();
        
        // Output list should only contain the public candidate
        apiResult.Data.Should().ContainSingle();
        apiResult.Data![0].FullName.Should().Be("Public Candidate A");
        apiResult.Data[0].VisibilityStatus.Should().Be("PUBLIC");
    }

    [Fact]
    public async Task PatchSetDefaultCv_WhenValidCandidate_ShouldToggleMainCv()
    {
        // Arrange
        var candidateUserId = 201;
        _fixture.CurrentUserServiceMock.UserId.Returns(candidateUserId);
        _fixture.CurrentUserServiceMock.HasPermission("cv:manage").Returns(true);

        int cv1Id = 0;
        int cv2Id = 0;

        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.CandidateCvs.RemoveRange(db.CandidateCvs);
            db.Candidates.RemoveRange(db.Candidates);
            db.Users.RemoveRange(db.Users);
            await db.SaveChangesAsync();

            var user = new User { Id = candidateUserId, Username = "cand_def", Email = "cand_def@example.com" };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var candidate = new Candidate
            {
                Id = 300,
                UserId = candidateUserId,
                FullName = "Candidate Default Test"
            };
            db.Candidates.Add(candidate);
            await db.SaveChangesAsync();

            var cv1 = new CandidateCv
            {
                CandidateId = candidate.Id,
                CvTitle = "First Main CV",
                FileUrl = "/uploads/cvs/cv1.pdf",
                IsDefault = true,
                CvType = CvType.UPLOAD
            };

            var cv2 = new CandidateCv
            {
                CandidateId = candidate.Id,
                CvTitle = "Second CV",
                FileUrl = "/uploads/cvs/cv2.pdf",
                IsDefault = false,
                CvType = CvType.UPLOAD
            };

            db.CandidateCvs.AddRange(cv1, cv2);
            await db.SaveChangesAsync();

            cv1Id = cv1.Id;
            cv2Id = cv2.Id;
        }

        // Act - Call PATCH set main to CV 2
        var response = await _client.PatchAsync($"/api/v1/candidates/cvs/{cv2Id}/main", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().BeTrue();

        // Verify state in MySQL database
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cvsInDb = await db.CandidateCvs.Where(c => c.CandidateId == 300).ToListAsync();
            
            var dbCv1 = cvsInDb.First(c => c.Id == cv1Id);
            var dbCv2 = cvsInDb.First(c => c.Id == cv2Id);

            dbCv1.IsDefault.Should().BeFalse(); // Cleared default flag
            dbCv2.IsDefault.Should().BeTrue();  // Set default flag
        }
    }

    public class MySqlFixture : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly MySqlContainer _mysqlContainer = new MySqlBuilder()
            .WithDatabase("hr_integration_test_db_cvs")
            .WithUsername("test_user_cvs")
            .WithPassword("test_password_cvs")
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
