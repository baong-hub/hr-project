using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Reports.Queries.GetEmployerSummary;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Reports.Queries.GetEmployerSummary;

public class GetEmployerSummaryHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly GetEmployerSummaryQueryHandler _handler;

    public GetEmployerSummaryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _handler = new GetEmployerSummaryQueryHandler(_context, _currentUserService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenValidEmployer_ShouldReturnSummary()
    {
        // Arrange
        _currentUserService.UserId.Returns(1);

        var employer = new Employer { Id = 10, UserId = 1, CompanyId = 100, Position = "HR" };
        _context.Employers.Add(employer);

        var job = new Job
        {
            Id = 1,
            CompanyId = 100,
            EmployerId = 10,
            Title = "Test Job",
            Description = "Description text that is sufficiently long enough to pass validation.",
            Requirements = "Requirements text that is sufficiently long enough.",
            City = "Hà Nội",
            Status = JobStatus.PUBLISHED,
            ExpiredAt = DateTime.Today.AddDays(30),
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };
        _context.Jobs.Add(job);

        var viewLog = new JobViewLog
        {
            Id = 1,
            JobId = 1,
            IpAddress = "127.0.0.1",
            ViewedAt = DateTime.Today.AddDays(-5)
        };
        _context.JobViewLogs.Add(viewLog);

        var app = new Domain.Entities.Application
        {
            Id = 1,
            JobId = 1,
            CandidateId = 1,
            CandidateCvId = 1,
            Status = ApplicationStatus.APPLIED,
            AppliedAt = DateTime.Today.AddDays(-5)
        };
        _context.Applications.Add(app);

        await _context.SaveChangesAsync();

        var query = new GetEmployerSummaryQuery(
            From: DateTime.Today.AddDays(-10).ToString("yyyy-MM-dd"),
            To: DateTime.Today.ToString("yyyy-MM-dd")
        );

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TotalActiveJobs.Should().Be(1);
        result.TotalApplications.Should().Be(1);
        result.TotalViews.Should().Be(1);
        result.AverageApplyRate.Should().Be(100.0);
    }

    [Fact]
    public async Task Handle_ShouldEnforceEmployerDataIsolation()
    {
        // Arrange
        _currentUserService.UserId.Returns(1);

        var employer1 = new Employer { Id = 10, UserId = 1, CompanyId = 100, Position = "HR" };
        var employer2 = new Employer { Id = 20, UserId = 2, CompanyId = 200, Position = "HR" };
        _context.Employers.AddRange(employer1, employer2);

        var job1 = new Job
        {
            Id = 1,
            CompanyId = 100,
            EmployerId = 10,
            Title = "My Job",
            Description = "Description text that is sufficiently long enough to pass validation.",
            Requirements = "Requirements text that is sufficiently long enough.",
            City = "Hà Nội",
            Status = JobStatus.PUBLISHED,
            ExpiredAt = DateTime.Today.AddDays(30),
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };
        var job2 = new Job
        {
            Id = 2,
            CompanyId = 200,
            EmployerId = 20,
            Title = "Other Job",
            Description = "Description text that is sufficiently long enough to pass validation.",
            Requirements = "Requirements text that is sufficiently long enough.",
            City = "Hà Nội",
            Status = JobStatus.PUBLISHED,
            ExpiredAt = DateTime.Today.AddDays(30),
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };
        _context.Jobs.AddRange(job1, job2);

        _context.JobViewLogs.Add(new JobViewLog { Id = 1, JobId = 1, IpAddress = "127.0.0.1", ViewedAt = DateTime.Today.AddDays(-5) });
        _context.JobViewLogs.Add(new JobViewLog { Id = 2, JobId = 2, IpAddress = "127.0.0.1", ViewedAt = DateTime.Today.AddDays(-5) });

        await _context.SaveChangesAsync();

        var query = new GetEmployerSummaryQuery(
            From: DateTime.Today.AddDays(-10).ToString("yyyy-MM-dd"),
            To: DateTime.Today.ToString("yyyy-MM-dd")
        );

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TotalViews.Should().Be(1);
    }
}
