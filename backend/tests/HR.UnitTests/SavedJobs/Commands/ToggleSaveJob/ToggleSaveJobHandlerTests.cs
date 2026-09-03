using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.SavedJobs.Commands.ToggleSaveJob;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.SavedJobs.Commands.ToggleSaveJob;

public class ToggleSaveJobHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ToggleSaveJobHandler _handler;

    public ToggleSaveJobHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _dateTimeProvider = Substitute.For<IDateTimeProvider>();
        
        _handler = new ToggleSaveJobHandler(_context, _currentUserService, _dateTimeProvider);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenUserNotCandidate_ShouldThrowForbidden()
    {
        // Arrange
        _currentUserService.UserId.Returns(999);
        
        var command = new ToggleSaveJobCommand(1);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("Chỉ ứng viên mới có quyền lưu tin tuyển dụng.");
    }

    [Fact]
    public async Task Handle_WhenJobNotSaved_ShouldSaveJob()
    {
        // Arrange
        var userId = 100;
        _currentUserService.UserId.Returns(userId);
        _dateTimeProvider.Now.Returns(new DateTime(2026, 8, 27, 12, 0, 0));

        var candidate = new Candidate { Id = userId, FullName = "Candidate A" };
        _context.Candidates.Add(candidate);

        var job = new Job
        {
            Id = 1,
            CompanyId = 1,
            EmployerId = 1,
            Title = "Job Test",
            Description = "A valid test description for a job listing.",
            Requirements = "A valid requirement list.",
            City = "Hà Nội",
            Status = JobStatus.PUBLISHED,
            ExpiredAt = DateTime.Today.AddDays(10),
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };
        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();

        var command = new ToggleSaveJobCommand(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.JobId.Should().Be(1);
        result.IsSaved.Should().BeTrue();

        var dbSaved = await _context.SavedJobs.FirstOrDefaultAsync(s => s.CandidateId == userId && s.JobId == 1);
        dbSaved.Should().NotBeNull();
        dbSaved!.SavedAt.Should().Be(new DateTime(2026, 8, 27, 12, 0, 0));
    }

    [Fact]
    public async Task Handle_WhenJobAlreadySaved_ShouldUnsaveJob()
    {
        // Arrange
        var userId = 100;
        _currentUserService.UserId.Returns(userId);

        var candidate = new Candidate { Id = userId, FullName = "Candidate A" };
        _context.Candidates.Add(candidate);

        var job = new Job
        {
            Id = 1,
            CompanyId = 1,
            EmployerId = 1,
            Title = "Job Test",
            Description = "A valid test description for a job listing.",
            Requirements = "A valid requirement list.",
            City = "Hà Nội",
            Status = JobStatus.PUBLISHED,
            ExpiredAt = DateTime.Today.AddDays(10),
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };
        _context.Jobs.Add(job);

        var savedJob = new SavedJob
        {
            CandidateId = userId,
            JobId = 1,
            SavedAt = DateTime.Now
        };
        _context.SavedJobs.Add(savedJob);
        await _context.SaveChangesAsync();

        var command = new ToggleSaveJobCommand(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.JobId.Should().Be(1);
        result.IsSaved.Should().BeFalse();

        var dbSaved = await _context.SavedJobs.FirstOrDefaultAsync(s => s.CandidateId == userId && s.JobId == 1);
        dbSaved.Should().BeNull();
    }
}
