using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Interfaces;
using HR.Application.Notifications.Commands.MarkAllAsRead;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Notifications.Commands.MarkAllAsRead;

public class MarkAllAsReadHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly MarkAllAsReadCommandHandler _handler;

    public MarkAllAsReadHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _handler = new MarkAllAsReadCommandHandler(_context, _currentUserService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenCalled_ShouldMarkAllUnreadNotificationsAsRead()
    {
        // Arrange
        _currentUserService.UserId.Returns(1);

        var notifications = new[]
        {
            new Notification { Id = 1, UserId = 1, Title = "T1", Content = "C1", NotificationType = NotificationType.JOB_ALERT, IsRead = false },
            new Notification { Id = 2, UserId = 1, Title = "T2", Content = "C2", NotificationType = NotificationType.JOB_ALERT, IsRead = true },
            new Notification { Id = 3, UserId = 1, Title = "T3", Content = "C3", NotificationType = NotificationType.JOB_ALERT, IsRead = false },
            new Notification { Id = 4, UserId = 2, Title = "T4", Content = "C4", NotificationType = NotificationType.JOB_ALERT, IsRead = false } // User 2's notification
        };

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        var command = new MarkAllAsReadCommand();

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();

        // User 1's notifications should all be read now
        var user1Notifications = await _context.Notifications.Where(n => n.UserId == 1).ToListAsync();
        user1Notifications.Should().HaveCount(3);
        user1Notifications.Should().OnlyContain(n => n.IsRead);

        // User 2's notification should remain unread
        var user2Notification = await _context.Notifications.FindAsync(4);
        user2Notification.Should().NotBeNull();
        user2Notification!.IsRead.Should().BeFalse();
    }
}
