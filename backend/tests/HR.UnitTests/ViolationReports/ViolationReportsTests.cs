using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.ViolationReports.Commands.CreateViolationReport;
using HR.Application.ViolationReports.Commands.ResolveViolationReport;
using HR.Application.ViolationReports.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.ViolationReports;

public class ViolationReportsTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ViolationReportsTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateViolationReport_WithValidJobTarget_ShouldCreatePendingReport()
    {
        // Arrange
        _currentUserService.UserId.Returns(100);

        var user = new User { Id = 100, FullName = "Le Van B", Email = "candidate@example.com" };
        _context.Users.Add(user);

        var candidate = new Candidate { Id = 100, FullName = "Le Van B", User = user };
        _context.Candidates.Add(candidate);

        var job = new Job { Id = 50, Title = "Senior Frontend Developer" };
        _context.Jobs.Add(job);

        await _context.SaveChangesAsync();

        var handler = new CreateViolationReportCommandHandler(_context, _currentUserService);
        var request = new CreateViolationReportRequest
        {
            TargetType = ViolationTargetType.JOB,
            TargetId = 50,
            Reason = "Tin tuyển dụng yêu cầu nộp phí cọc",
            Description = "Yêu cầu chuyển tiền 500k trước khi phỏng vấn"
        };

        // Act
        var result = await handler.Handle(new CreateViolationReportCommand(request), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(ViolationStatus.PENDING);
        result.TargetTitle.Should().Be("Senior Frontend Developer");

        var report = await _context.ViolationReports.FirstOrDefaultAsync(r => r.TargetId == 50);
        report.Should().NotBeNull();
        report!.Reason.Should().Be("Tin tuyển dụng yêu cầu nộp phí cọc");
    }

    [Fact]
    public async Task ResolveViolationReport_WithHideTargetTrue_ShouldCloseJob()
    {
        // Arrange
        _currentUserService.UserId.Returns(1); // Admin

        var report = new ViolationReport
        {
            Id = 5,
            TargetType = ViolationTargetType.JOB,
            TargetId = 77,
            Status = ViolationStatus.PENDING
        };
        _context.ViolationReports.Add(report);

        var job = new Job { Id = 77, Status = JobStatus.PUBLISHED };
        _context.Jobs.Add(job);

        await _context.SaveChangesAsync();

        var handler = new ResolveViolationReportCommandHandler(_context, _currentUserService);
        var request = new ResolveViolationReportRequest
        {
            Status = ViolationStatus.RESOLVED,
            Resolution = "Đã xác minh vi phạm và khóa tin đăng",
            HideTarget = true
        };

        // Act
        var result = await handler.Handle(new ResolveViolationReportCommand(5, request), CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        var updatedReport = await _context.ViolationReports.FindAsync(5);
        updatedReport!.Status.Should().Be(ViolationStatus.RESOLVED);

        var updatedJob = await _context.Jobs.FindAsync(77);
        updatedJob!.Status.Should().Be(JobStatus.CLOSED);
        updatedJob.DeletedAt.Should().NotBeNull();
    }
}
