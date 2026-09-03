using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Notifications.Commands.MarkAsRead;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Notifications.Commands.MarkAsRead;

public class MarkAsReadHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly MarkAsReadCommandHandler _handler;

    public MarkAsReadHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _handler = new MarkAsReadCommandHandler(_context, _currentUserService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenNotificationNotExists_ShouldThrowNotFoundException()
    {
        // Arrange
        _currentUserService.UserId.Returns(1);
        var command = new MarkAsReadCommand(999);

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Thông báo không tồn tại");
    }

    [Fact]
    public async Task Handle_WhenUserNotOwnNotification_ShouldThrowForbiddenException()
    {
        // Arrange
        _currentUserService.UserId.Returns(2);

        var notification = new Notification
        {
            Id = 1,
            UserId = 1,
            Title = "Test Title",
            Content = "Test Content",
            NotificationType = NotificationType.JOB_ALERT,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        var command = new MarkAsReadCommand(1);

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("Bạn không có quyền thao tác trên thông báo này");
    }

    [Fact]
    public async Task Handle_WhenValidInput_ShouldMarkAsRead()
    {
        // Arrange
        _currentUserService.UserId.Returns(1);

        var notification = new Notification
        {
            Id = 1,
            UserId = 1,
            Title = "Test Title",
            Content = "Test Content",
            NotificationType = NotificationType.JOB_ALERT,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        var command = new MarkAsReadCommand(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();

        var updatedNotification = await _context.Notifications.FindAsync(1);
        updatedNotification.Should().NotBeNull();
        updatedNotification!.IsRead.Should().BeTrue();
    }
}
