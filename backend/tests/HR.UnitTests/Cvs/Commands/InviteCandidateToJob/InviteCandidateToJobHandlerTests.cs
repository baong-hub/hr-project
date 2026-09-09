using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Cvs.Commands.InviteCandidateToJob;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Cvs.Commands.InviteCandidateToJob;

public class InviteCandidateToJobHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;
    private readonly INotificationSender _notificationSender;
    private readonly InviteCandidateToJobCommandHandler _handler;

    public InviteCandidateToJobHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _emailService = Substitute.For<IEmailService>();
        _notificationSender = Substitute.For<INotificationSender>();

        _currentUserService.UserId.Returns(100);

        _handler = new InviteCandidateToJobCommandHandler(
            _context,
            _currentUserService,
            _emailService,
            _notificationSender
        );
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenCandidateNotFound_ShouldThrowNotFoundException()
    {
        // Act
        var act = () => _handler.Handle(new InviteCandidateToJobCommand(999, 1, "Hello"), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Không tìm thấy hồ sơ ứng viên*");
    }

    [Fact]
    public async Task Handle_WhenCandidateIsPrivate_ShouldThrowBadRequestException()
    {
        // Arrange
        var candidateUser = new User { Id = 1, Username = "cand1", Email = "cand1@test.com", FullName = "Candidate One" };
        var candidate = new Candidate
        {
            Id = 1,
            FullName = "Candidate One",
            VisibilityStatus = CandidateVisibilityStatus.PRIVATE,
            User = candidateUser
        };
        _context.Users.Add(candidateUser);
        _context.Candidates.Add(candidate);
        await _context.SaveChangesAsync();

        // Act
        var act = () => _handler.Handle(new InviteCandidateToJobCommand(1, 1, "Hello"), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("*Ứng viên này hiện đang bật chế độ riêng tư*");
    }

    [Fact]
    public async Task Handle_WhenJobNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var candidateUser = new User { Id = 2, Username = "cand2", Email = "cand2@test.com", FullName = "Candidate Two" };
        var candidate = new Candidate
        {
            Id = 2,
            FullName = "Candidate Two",
            VisibilityStatus = CandidateVisibilityStatus.PUBLIC,
            User = candidateUser
        };
        _context.Users.Add(candidateUser);
        _context.Candidates.Add(candidate);
        await _context.SaveChangesAsync();

        // Act
        var act = () => _handler.Handle(new InviteCandidateToJobCommand(2, 999, "Hello"), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Tin tuyển dụng không tồn tại*");
    }

    [Fact]
    public async Task Handle_WhenValid_ShouldSendNotificationAndReturnTrue()
    {
        // Arrange
        var employerUser = new User { Id = 100, Username = "employer1", Email = "emp@test.com", FullName = "HR Manager" };
        var company = new Company { Id = 1, Name = "Tech Corp" };
        var job = new Job { Id = 10, Title = "Senior .NET Engineer", CompanyId = 1, Company = company };

        var candidateUser = new User { Id = 3, Username = "cand3", Email = "cand3@test.com", FullName = "Nguyễn Văn Dev" };
        var candidate = new Candidate
        {
            Id = 3,
            FullName = "Nguyễn Văn Dev",
            VisibilityStatus = CandidateVisibilityStatus.PUBLIC,
            User = candidateUser
        };

        _context.Users.AddRange(employerUser, candidateUser);
        _context.Companies.Add(company);
        _context.Jobs.Add(job);
        _context.Candidates.Add(candidate);
        await _context.SaveChangesAsync();

        // Act
        var result = await _handler.Handle(
            new InviteCandidateToJobCommand(3, 10, "Trân trọng mời bạn tham gia đội ngũ của Tech Corp!"),
            CancellationToken.None
        );

        // Assert
        result.Should().BeTrue();

        await _notificationSender.Received(1).SendNotificationAsync(
            3,
            Arg.Is<string>(s => s.Contains("Senior .NET Engineer")),
            Arg.Any<string>(),
            NotificationType.JOB_INVITATION,
            Arg.Is<string>(s => s.Contains("/jobs/10")),
            Arg.Any<CancellationToken>()
        );

        // Check that conversation was created
        var convo = await _context.Conversations.FirstOrDefaultAsync(c => c.CandidateUserId == 3 && c.JobId == 10);
        convo.Should().NotBeNull();
        convo!.EmployerUserId.Should().Be(100);
    }
}
