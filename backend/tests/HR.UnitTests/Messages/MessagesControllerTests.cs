using System;
using System.Threading.Tasks;
using FluentAssertions;
using HR.API.Controllers;
using HR.API.Hubs;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Domain.Entities;
using HR.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Messages;

public class MessagesControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;
    private readonly IHubContext<ChatHub> _chatHub;
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly MessagesController _controller;

    public MessagesControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _emailService = Substitute.For<IEmailService>();
        _chatHub = Substitute.For<IHubContext<ChatHub>>();
        _notificationHub = Substitute.For<IHubContext<NotificationHub>>();

        _controller = new MessagesController(
            _context,
            _currentUserService,
            _emailService,
            _chatHub,
            _notificationHub
        );
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task SendMessage_WhenContentIsEmpty_ShouldReturnBadRequest()
    {
        // Arrange
        var dto = new MessagesController.SendMessageDto
        {
            ConversationId = 1,
            Content = ""
        };

        // Act
        var result = await _controller.SendMessage(dto);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task SendMessage_WhenConversationNotFound_ShouldReturnNotFound()
    {
        // Arrange
        _currentUserService.UserId.Returns(10);
        var dto = new MessagesController.SendMessageDto
        {
            ConversationId = 999,
            Content = "Hello there!"
        };

        // Act
        var result = await _controller.SendMessage(dto);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetConversations_WhenUserHasNoConversations_ShouldReturnEmptyList()
    {
        // Arrange
        _currentUserService.UserId.Returns(99);

        // Act
        var actionResult = await _controller.GetConversations();

        // Assert
        var okResult = actionResult as OkObjectResult;
        okResult.Should().NotBeNull();
        var response = okResult!.Value as ApiResponse<object>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
    }
}
