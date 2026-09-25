using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Auth.Commands.GoogleLogin;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Authentication;

public class GoogleLoginTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IPasswordHasher _passwordHasher;

    public GoogleLoginTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _jwtService = Substitute.For<IJwtService>();
        _passwordHasher = Substitute.For<IPasswordHasher>();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GoogleLogin_WithoutGoogleToken_ShouldThrowBadRequestException()
    {
        // Arrange
        var handler = new GoogleLoginCommandHandler(_context, _jwtService, _passwordHasher);
        var command = new GoogleLoginCommand(
            Email: "attacker@fake.com",
            GoogleToken: null,
            FullName: "Attacker",
            AvatarUrl: null
        );

        // Act
        var act = async () => await handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("*Google Token là bắt buộc*");
    }

    [Fact]
    public async Task GoogleLogin_WithInvalidGoogleToken_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var handler = new GoogleLoginCommandHandler(_context, _jwtService, _passwordHasher);
        var command = new GoogleLoginCommand(
            Email: "victim@example.com",
            GoogleToken: "invalid_unverified_bogus_token_12345",
            FullName: "Victim",
            AvatarUrl: null
        );

        // Act
        var act = async () => await handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>();
    }
}
