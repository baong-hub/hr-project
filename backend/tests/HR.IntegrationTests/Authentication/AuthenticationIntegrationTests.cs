using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.MySql;
using Xunit;
using HR.Application.Common.Models;
using HR.Application.Auth.Dtos;
using HR.Application.Auth.Commands.RegisterCandidate;
using HR.Application.Auth.Commands.Login;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using HR.Application.Common.Interfaces;

namespace HR.IntegrationTests.Authentication;

public class AuthenticationIntegrationTests : IClassFixture<AuthenticationIntegrationTests.MySqlFixture>
{
    private readonly MySqlFixture _fixture;
    private readonly HttpClient _client;

    public AuthenticationIntegrationTests(MySqlFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.CreateClient();
    }

    [Fact]
    public async Task Post_WhenValidCandidateInput_ShouldReturn201Created()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Users.RemoveRange(db.Users);
            await db.SaveChangesAsync();
        }

        var command = new RegisterCandidateCommand(
            Email: "newcandidate_integration@example.com",
            Password: "Password123",
            PhoneNumber: "0901234567",
            FullName: "Integration Candidate"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register/candidate", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<UserDto>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().NotBeNull();
        apiResult.Data!.Email.Should().Be("newcandidate_integration@example.com");
    }

    [Fact]
    public async Task Post_WhenValidLogin_ShouldReturn200WithTokens()
    {
        // Arrange
        var email = "login_success@example.com";
        var password = "Password123";
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            
            db.Users.RemoveRange(db.Users);
            await db.SaveChangesAsync();

            var role = await db.Roles.FirstAsync(r => r.Name == "CANDIDATE");
            var user = new User
            {
                Email = email,
                PasswordHash = hasher.Hash(password),
                PhoneNumber = "0987654321",
                RoleId = role.Id,
                Status = UserStatus.ACTIVE
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        var command = new LoginCommand(Email: email, Password: password);

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResultDto>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeTrue();
        apiResult.Data.Should().NotBeNull();
        apiResult.Data!.AccessToken.Should().NotBeNullOrEmpty();
        apiResult.Data.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Post_WhenInvalidPassword_ShouldReturn400WithErrorCode()
    {
        // Arrange
        var email = "login_fail@example.com";
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            
            db.Users.RemoveRange(db.Users);
            await db.SaveChangesAsync();

            var role = await db.Roles.FirstAsync(r => r.Name == "CANDIDATE");
            var user = new User
            {
                Email = email,
                PasswordHash = hasher.Hash("CorrectPassword123"),
                PhoneNumber = "0987654321",
                RoleId = role.Id,
                Status = UserStatus.ACTIVE
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        var command = new LoginCommand(Email: email, Password: "WrongPassword123");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var apiResult = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        apiResult.Should().NotBeNull();
        apiResult!.Success.Should().BeFalse();
        apiResult.Error.Should().NotBeNull();
        apiResult.Error!.Code.Should().Be("AUTH_INVALID_CREDENTIALS");
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

            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Database.MigrateAsync();

            // Seed Roles if missing
            if (!await db.Roles.AnyAsync(r => r.Name == "CANDIDATE"))
            {
                db.Roles.Add(new Role { Name = "CANDIDATE" });
            }
            if (!await db.Roles.AnyAsync(r => r.Name == "EMPLOYER"))
            {
                db.Roles.Add(new Role { Name = "EMPLOYER" });
            }
            await db.SaveChangesAsync();
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
            });
        }
    }
}
