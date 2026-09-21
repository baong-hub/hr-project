using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Interviews;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;
using ApplicationEntity = HR.Domain.Entities.Application;

namespace HR.UnitTests.Interviews;

public class CancelInterviewCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly CancelInterviewCommandHandler _handler;

    public CancelInterviewCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _handler = new CancelInterviewCommandHandler(_context, _currentUserService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenInterviewNotFound_ShouldThrowNotFoundException()
    {
        // Act & Assert
        var act = () => _handler.Handle(new CancelInterviewCommand(999), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Lịch phỏng vấn không tồn tại*");
    }

    [Fact]
    public async Task Handle_WhenEmployerFromDifferentCompany_ShouldThrowForbiddenException()
    {
        // Arrange
        var userId = 10;
        _currentUserService.UserId.Returns(userId);

        var employer = new Employer { Id = 1, UserId = userId, CompanyId = 1 };
        _context.Employers.Add(employer);

        var job = new Job { Id = 1, CompanyId = 2, Title = "Backend Dev" };
        var application = new ApplicationEntity { Id = 1, Job = job, JobId = 1, CandidateId = 5 };
        var interview = new Interview
        {
            Id = 100,
            Application = application,
            ApplicationId = 1,
            RoundName = "Vòng 1",
            Status = InterviewStatus.INTERVIEW_SCHEDULED
        };
        _context.Interviews.Add(interview);
        await _context.SaveChangesAsync();

        // Act & Assert
        var act = () => _handler.Handle(new CancelInterviewCommand(100), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_WhenValidRequest_ShouldSetStatusCancelled()
    {
        // Arrange
        var userId = 10;
        _currentUserService.UserId.Returns(userId);

        var employer = new Employer { Id = 1, UserId = userId, CompanyId = 1 };
        _context.Employers.Add(employer);

        var job = new Job { Id = 1, CompanyId = 1, Title = "Backend Dev" };
        var application = new ApplicationEntity { Id = 1, Job = job, JobId = 1, CandidateId = 5 };
        var interview = new Interview
        {
            Id = 101,
            Application = application,
            ApplicationId = 1,
            RoundName = "Vòng 1",
            Status = InterviewStatus.INTERVIEW_SCHEDULED
        };
        _context.Interviews.Add(interview);
        await _context.SaveChangesAsync();

        // Act
        var result = await _handler.Handle(new CancelInterviewCommand(101), CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        var updated = await _context.Interviews.FindAsync(101);
        updated!.Status.Should().Be(InterviewStatus.CANCELLED);
    }
}
