using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using MediatR;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Applications.Commands.ChangeApplicationStatus;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Applications.Commands.ChangeApplicationStatus;

public class ChangeApplicationStatusHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationSender _notificationSender;
    private readonly IEmailService _emailService;
    private readonly IMediator _mediator;
    private readonly ChangeApplicationStatusHandler _handler;

    public ChangeApplicationStatusHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _notificationSender = Substitute.For<INotificationSender>();
        _emailService = Substitute.For<IEmailService>();
        _mediator = Substitute.For<IMediator>();
        _handler = new ChangeApplicationStatusHandler(_context, _currentUserService, _notificationSender, _emailService, _mediator);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_FromAcceptedToRejected_ShouldThrowBadRequestException()
    {
        // Arrange
        var userId = 5;
        _currentUserService.UserId.Returns(userId);
        _currentUserService.Username.Returns("recruiter");

        var company = new Company { Id = 1, Name = "Tech Corp" };
        var candidate = new Candidate { Id = 1, UserId = 10, FullName = "Nguyen Van A" };
        var employer = new Employer { Id = 1, UserId = userId, CompanyId = 1 };
        var job = new Job { Id = 1, CompanyId = 1, EmployerId = 1, Title = ".NET Dev", Description = "Desc...", Requirements = "Reqs..." };
        
        // Final state: HIRED (accepted)
        var app = new HR.Domain.Entities.Application 
        { 
            Id = 1, 
            JobId = 1, 
            CandidateId = 1, 
            CandidateCvId = 1, 
            Status = ApplicationStatus.HIRED 
        };

        _context.Companies.Add(company);
        _context.Candidates.Add(candidate);
        _context.Employers.Add(employer);
        _context.Jobs.Add(job);
        _context.Applications.Add(app);
        await _context.SaveChangesAsync();

        var command = new ChangeApplicationStatusCommand(Id: 1, Status: "REJECTED");

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.And.Code.Should().Be("APPLICATION_STATUS_FINAL");
    }

    [Fact]
    public async Task Handle_FromSubmittedToReviewing_ShouldSucceed()
    {
        // Arrange
        var userId = 5;
        _currentUserService.UserId.Returns(userId);
        _currentUserService.Username.Returns("recruiter");

        var company = new Company { Id = 2, Name = "Tech Corp" };
        var candidate = new Candidate { Id = 2, UserId = 11, FullName = "Nguyen Van B" };
        var employer = new Employer { Id = 2, UserId = userId, CompanyId = 2 };
        var job = new Job { Id = 2, CompanyId = 2, EmployerId = 2, Title = ".NET Dev", Description = "Desc...", Requirements = "Reqs..." };
        
        // Initial state: APPLIED (submitted)
        var app = new HR.Domain.Entities.Application 
        { 
            Id = 2, 
            JobId = 2, 
            CandidateId = 2, 
            CandidateCvId = 1, 
            Status = ApplicationStatus.APPLIED 
        };

        _context.Companies.Add(company);
        _context.Candidates.Add(candidate);
        _context.Employers.Add(employer);
        _context.Jobs.Add(job);
        _context.Applications.Add(app);
        await _context.SaveChangesAsync();

        var command = new ChangeApplicationStatusCommand(Id: 2, Status: "SCREENING"); // SCREENING represents reviewing

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data.Should().BeTrue();

        var updatedApp = await _context.Applications.FirstOrDefaultAsync(a => a.Id == 2);
        updatedApp.Should().NotBeNull();
        updatedApp!.Status.Should().Be(ApplicationStatus.SCREENING);
    }
}
