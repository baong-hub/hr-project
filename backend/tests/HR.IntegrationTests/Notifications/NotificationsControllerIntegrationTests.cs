using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Models;
using HR.Application.Notifications.Dtos;
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

namespace HR.IntegrationTests.Notifications;

public class NotificationsControllerIntegrationTests : IClassFixture<NotificationsControllerIntegrationTests.MySqlFixture>
{
    private readonly MySqlFixture _fixture;
    private readonly HttpClient _client;

    public NotificationsControllerIntegrationTests(MySqlFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.CreateClient();
    }

    [Fact]
    public async Task Get_WhenCalled_ShouldReturnNotificationsForCurrentUser()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.Notifications.RemoveRange(db.Notifications);
            await db.SaveChangesAsync();

            var notifications = new[]
            {
                new Notification { Id = 10, UserId = 1, Title = "My Notification 1", Content = "Content 1", NotificationType = NotificationType.JOB_ALERT, IsRead = false },
                new Notification { Id = 11, UserId = 1, Title = "My Notification 2", Content = "Content 2", NotificationType = NotificationType.APPLICATION_STATUS, IsRead = true },
                new Notification { Id = 12, UserId = 2, Title = "Other Notification", Content = "Content 3", NotificationType = NotificationType.INTERVIEW_INVITE, IsRead = false }
            };

            db.Notifications.AddRange(notifications);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/notifications");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<NotificationDto>>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Items.Should().HaveCount(2);
        result.Data.Items.Should().OnlyContain(n => n.Title.StartsWith("My Notification"));
    }

    [Fact]
    public async Task GetUnreadCount_WhenCalled_ShouldReturnCorrectCount()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.Notifications.RemoveRange(db.Notifications);
            await db.SaveChangesAsync();

            var notifications = new[]
            {
                new Notification { Id = 20, UserId = 1, Title = "N1", Content = "C1", NotificationType = NotificationType.JOB_ALERT, IsRead = false },
                new Notification { Id = 21, UserId = 1, Title = "N2", Content = "C2", NotificationType = NotificationType.APPLICATION_STATUS, IsRead = true },
                new Notification { Id = 22, UserId = 1, Title = "N3", Content = "C3", NotificationType = NotificationType.INTERVIEW_INVITE, IsRead = false },
                new Notification { Id = 23, UserId = 2, Title = "N4", Content = "C4", NotificationType = NotificationType.JOB_ALERT, IsRead = false }
            };

            db.Notifications.AddRange(notifications);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/notifications/unread-count");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<UnreadCountDto>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Count.Should().Be(2);
    }

    [Fact]
    public async Task PatchRead_WhenValidId_ShouldMarkAsRead()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.Notifications.RemoveRange(db.Notifications);
            await db.SaveChangesAsync();

            var notification = new Notification
            {
                Id = 30,
                UserId = 1,
                Title = "N1",
                Content = "C1",
                NotificationType = NotificationType.JOB_ALERT,
                IsRead = false
            };

            db.Notifications.Add(notification);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.PatchAsync("/api/v1/notifications/30/read", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().BeTrue();

        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dbNotif = await db.Notifications.FindAsync(30);
            dbNotif.Should().NotBeNull();
            dbNotif!.IsRead.Should().BeTrue();
        }
    }

    [Fact]
    public async Task PostReadAll_WhenCalled_ShouldMarkAllAsRead()
    {
        // Arrange
        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            db.Notifications.RemoveRange(db.Notifications);
            await db.SaveChangesAsync();

            var notifications = new[]
            {
                new Notification { Id = 40, UserId = 1, Title = "N1", Content = "C1", NotificationType = NotificationType.JOB_ALERT, IsRead = false },
                new Notification { Id = 41, UserId = 1, Title = "N2", Content = "C2", NotificationType = NotificationType.APPLICATION_STATUS, IsRead = false },
                new Notification { Id = 42, UserId = 2, Title = "N3", Content = "C3", NotificationType = NotificationType.INTERVIEW_INVITE, IsRead = false }
            };

            db.Notifications.AddRange(notifications);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await _client.PostAsync("/api/v1/notifications/read-all", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().BeTrue();

        using (var scope = _fixture.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user1UnreadCount = await db.Notifications.CountAsync(n => n.UserId == 1 && !n.IsRead);
            user1UnreadCount.Should().Be(0);

            var user2UnreadCount = await db.Notifications.CountAsync(n => n.UserId == 2 && !n.IsRead);
            user2UnreadCount.Should().Be(1);
        }
    }

    public class MySqlFixture : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly MySqlContainer _mysqlContainer = new MySqlBuilder()
            .WithDatabase("hr_test_notifications_db")
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
                mockCurrentUserService.Username.Returns("test_user_1");
                mockCurrentUserService.HasPermission(Arg.Any<string>()).Returns(true);

                services.AddSingleton(mockCurrentUserService);
            });
        }
    }
}
