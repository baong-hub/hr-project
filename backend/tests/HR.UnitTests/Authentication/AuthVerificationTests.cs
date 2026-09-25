using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Auth.Commands.ForgotPassword;
using HR.Application.Auth.Commands.ResetPasswordWithToken;
using HR.Application.Auth.Commands.VerifyEmail;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Authentication;

public class AuthVerificationTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

    public AuthVerificationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _emailService = Substitute.For<IEmailService>();
        _passwordHasher = Substitute.For<IPasswordHasher>();
        _configuration = Substitute.For<Microsoft.Extensions.Configuration.IConfiguration>();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task VerifyEmail_WithValidToken_ShouldMarkUserVerified()
    {
        // Arrange
        var token = "valid_token_123";
        var user = new User
        {
            Id = 1,
            Email = "user@example.com",
            IsEmailVerified = false,
            EmailVerificationToken = token,
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(5)
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var handler = new VerifyEmailCommandHandler(_context);

        // Act
        var result = await handler.Handle(new VerifyEmailCommand(token), CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        var updated = await _context.Users.FindAsync(1);
        updated!.IsEmailVerified.Should().BeTrue();
        updated.EmailVerificationToken.Should().BeNull();
    }

    [Fact]
    public async Task VerifyEmail_WithExpiredToken_ShouldThrowBadRequestException()
    {
        // Arrange
        var token = "expired_token";
        var user = new User
        {
            Id = 2,
            Email = "expired@example.com",
            IsEmailVerified = false,
            EmailVerificationToken = token,
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(-1)
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var handler = new VerifyEmailCommandHandler(_context);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(() => handler.Handle(new VerifyEmailCommand(token), CancellationToken.None));
    }

    [Fact]
    public async Task ForgotPassword_WithExistingEmail_ShouldGenerateTokenAndSendEmail()
    {
        // Arrange
        var user = new User
        {
            Id = 3,
            Email = "forgot@example.com",
            FullName = "Nguyen Van A"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var handler = new ForgotPasswordCommandHandler(_context, _emailService, _configuration);

        // Act
        var result = await handler.Handle(new ForgotPasswordCommand("forgot@example.com"), CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        var updated = await _context.Users.FindAsync(3);
        updated!.PasswordResetToken.Should().NotBeNullOrWhiteSpace();
        updated.PasswordResetTokenExpiresAt.Should().BeAfter(DateTime.UtcNow);
        await _emailService.Received(1).SendEmailAsync(
            Arg.Is<string>(to => to == "forgot@example.com"),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ResetPasswordWithToken_WithValidToken_ShouldUpdatePasswordHash()
    {
        // Arrange
        _passwordHasher.Hash("NewSecurePassword123").Returns("new_hashed_password");

        var token = "reset_token_xyz";
        var user = new User
        {
            Id = 4,
            Email = "reset@example.com",
            PasswordHash = "old_hash",
            PasswordResetToken = token,
            PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var handler = new ResetPasswordWithTokenCommandHandler(_context, _passwordHasher);

        // Act
        var result = await handler.Handle(new ResetPasswordWithTokenCommand("reset@example.com", token, "NewSecurePassword123"), CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        var updated = await _context.Users.FindAsync(4);
        updated!.PasswordHash.Should().Be("new_hashed_password");
        updated.PasswordResetToken.Should().BeNull();
    }
}
