using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Applications.Commands.SubmitApplication;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using MediatR;
using Xunit;

namespace HR.UnitTests.Applications.Commands.SubmitApplication;

public class SubmitApplicationHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMediator _mediator;
    private readonly SubmitApplicationHandler _handler;

    public SubmitApplicationHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _mediator = Substitute.For<IMediator>();
        _handler = new SubmitApplicationHandler(_context, _currentUserService, _mediator);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenAlreadyApplied_ShouldThrowConflictException()
    {
        // Arrange
        var userId = 1;
        _currentUserService.UserId.Returns(userId);

        var candidate = new Candidate { Id = 1, UserId = userId, VisibilityStatus = CandidateVisibilityStatus.PUBLIC };
        var job = new Job { Id = 1, CompanyId = 1, EmployerId = 1, Title = "Senior .NET Dev", Status = JobStatus.PUBLISHED, ExpiredAt = DateTime.Today.AddDays(10), Description = "Long desc...", Requirements = "Long reqs..." };
        var cv = new CandidateCv { Id = 1, CandidateId = 1, CvTitle = "My CV", FileUrl = "http://..." };
        var application = new HR.Domain.Entities.Application { Id = 1, JobId = 1, CandidateId = 1, CandidateCvId = 1, Status = ApplicationStatus.APPLIED };

        _context.Candidates.Add(candidate);
        _context.Jobs.Add(job);
        _context.CandidateCvs.Add(cv);
        _context.Applications.Add(application);
        await _context.SaveChangesAsync();

        var command = new SubmitApplicationCommand(JobId: 1, CandidateCvId: 1, CoverLetter: "Please hire me.");

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.And.Code.Should().Be("APPLICATION_ALREADY_SUBMITTED");
    }

    [Fact]
    public async Task Handle_WhenJobClosedOrExpired_ShouldThrowBadRequestException()
    {
        // Arrange
        var userId = 1;
        _currentUserService.UserId.Returns(userId);

        var candidate = new Candidate { Id = 1, UserId = userId, VisibilityStatus = CandidateVisibilityStatus.PUBLIC };
        var expiredJob = new Job { Id = 2, CompanyId = 1, EmployerId = 1, Title = "Expired Job", Status = JobStatus.PUBLISHED, ExpiredAt = DateTime.Today.AddDays(-1), Description = "Long desc...", Requirements = "Long reqs..." };
        var cv = new CandidateCv { Id = 1, CandidateId = 1, CvTitle = "My CV", FileUrl = "http://..." };

        _context.Candidates.Add(candidate);
        _context.Jobs.Add(expiredJob);
        _context.CandidateCvs.Add(cv);
        await _context.SaveChangesAsync();

        var command = new SubmitApplicationCommand(JobId: 2, CandidateCvId: 1, CoverLetter: "Let me apply.");

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.And.Code.Should().Be("JOB_NOT_ACTIVE");
    }

    [Fact]
    public async Task Handle_WhenValidInput_ShouldCreateApplication()
    {
        // Arrange
        var userId = 1;
        _currentUserService.UserId.Returns(userId);

        var candidate = new Candidate { Id = 1, UserId = userId, VisibilityStatus = CandidateVisibilityStatus.PUBLIC, Skills = "C#, React", ExperienceSummary = "5 years" };
        var job = new Job { Id = 3, CompanyId = 1, EmployerId = 1, Title = "Senior .NET Dev", Status = JobStatus.PUBLISHED, ExpiredAt = DateTime.Today.AddDays(10), Description = "Long desc...", Requirements = "Long reqs..." };
        var cv = new CandidateCv { Id = 1, CandidateId = 1, CvTitle = "My CV", FileUrl = "http://..." };

        _context.Candidates.Add(candidate);
        _context.Jobs.Add(job);
        _context.CandidateCvs.Add(cv);
        await _context.SaveChangesAsync();

        var command = new SubmitApplicationCommand(JobId: 3, CandidateCvId: 1, CoverLetter: "Pick me!");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Status.Should().Be(ApplicationStatus.APPLIED.ToString());
        result.Data.JobId.Should().Be(3);

        var appInDb = await _context.Applications.FirstOrDefaultAsync(a => a.JobId == 3 && a.CandidateId == 1);
        appInDb.Should().NotBeNull();
        appInDb!.Status.Should().Be(ApplicationStatus.APPLIED);
    }
}
