using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;
using HR.Application.Auth.Commands.RegisterCandidate;
using HR.Application.Auth.Commands.RegisterEmployer;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;

namespace HR.UnitTests.Authentication.Commands;

public class RegisterTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly RegisterCandidateHandler _candidateHandler;
    private readonly RegisterEmployerHandler _employerHandler;

    public RegisterTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _passwordHasher = Substitute.For<IPasswordHasher>();
        _passwordHasher.Hash(Arg.Any<string>()).Returns("hashed_password");

        _candidateHandler = new RegisterCandidateHandler(_context, _passwordHasher);
        _employerHandler = new RegisterEmployerHandler(_context, _passwordHasher);

        // Seed default roles
        _context.Roles.AddRange(
            new Role { Name = "CANDIDATE" },
            new Role { Name = "EMPLOYER" }
        );
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenEmailExists_ShouldThrowConflict()
    {
        // Arrange
        var existingEmail = "candidate@example.com";
        var existingUser = new User
        {
            Email = existingEmail,
            PasswordHash = "some_hash",
            PhoneNumber = "0987654321",
            RoleId = 1,
            Status = UserStatus.ACTIVE
        };
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var command = new RegisterCandidateCommand(
            Email: existingEmail,
            Password: "Password123",
            PhoneNumber: "0901234567",
            FullName: "Test Candidate"
        );

        // Act
        Func<Task> act = async () => await _candidateHandler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("Email đã được sử dụng trên hệ thống");
    }

    [Fact]
    public async Task Handle_WhenValidCandidateInput_ShouldCreateUser()
    {
        // Arrange
        var command = new RegisterCandidateCommand(
            Email: "newcandidate@example.com",
            Password: "Password123",
            PhoneNumber: "0901234567",
            FullName: "New Candidate"
        );

        // Act
        var result = await _candidateHandler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("newcandidate@example.com");
        result.Role.Should().Be("CANDIDATE");
        result.Status.Should().Be(UserStatus.ACTIVE.ToString());

        var createdUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "newcandidate@example.com");
        createdUser.Should().NotBeNull();
        createdUser!.PasswordHash.Should().Be("hashed_password");
        createdUser.Status.Should().Be(UserStatus.ACTIVE);

        var createdCandidate = await _context.Candidates.FirstOrDefaultAsync(c => c.Id == createdUser.Id);
        createdCandidate.Should().NotBeNull();
        createdCandidate!.FullName.Should().Be("New Candidate");
    }

    [Fact]
    public async Task Handle_WhenValidEmployerInput_ShouldCreatePendingUser()
    {
        // Arrange
        var command = new RegisterEmployerCommand(
            Email: "newemployer@example.com",
            Password: "Password123",
            FullName: "New Employer",
            PhoneNumber: "0912345678",
            Position: "HR Director",
            CompanyName: "Hamo Corp"
        );

        // Act
        var result = await _employerHandler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("newemployer@example.com");
        result.Role.Should().Be("EMPLOYER");
        result.Status.Should().Be(UserStatus.PENDING_APPROVAL.ToString());

        var createdUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "newemployer@example.com");
        createdUser.Should().NotBeNull();
        createdUser!.Status.Should().Be(UserStatus.PENDING_APPROVAL);

        var createdEmployer = await _context.Employers
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.UserId == createdUser.Id);
        createdEmployer.Should().NotBeNull();
        createdEmployer!.Position.Should().Be("HR Director");
        createdEmployer.Company.Name.Should().Be("Hamo Corp");
    }
}
