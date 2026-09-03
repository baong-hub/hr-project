using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Jobs.Commands.CreateJob;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Jobs.Commands.CreateJob;

public class CreateJobHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly CreateJobCommandHandler _handler;

    public CreateJobHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _handler = new CreateJobCommandHandler(_context, _currentUserService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenEmployerNotActive_ShouldThrowForbidden()
    {
        // Arrange
        var userId = 10;
        _currentUserService.UserId.Returns(userId);

        var company = new Company
        {
            Id = 1,
            Code = "C1",
            Name = "Unverified Corp",
            IsVerified = false // Unverified company
        };
        
        var employer = new Employer
        {
            Id = 1,
            UserId = userId,
            CompanyId = 1,
            Company = company,
            Position = "HR Manager"
        };

        _context.Companies.Add(company);
        _context.Employers.Add(employer);
        await _context.SaveChangesAsync();

        var command = new CreateJobCommand(
            Title: "Junior React Dev",
            Description: "A description of the React role, containing enough characters to pass validation if needed.",
            Requirements: "A description of the React role requirements, containing enough characters.",
            Benefits: "Snacks",
            SalaryFrom: 15000000,
            SalaryTo: 20000000,
            City: "Hà Nội",
            ExpiredAt: DateTime.Today.AddDays(30)
        );

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("Tài khoản doanh nghiệp chưa được duyệt (VERIFIED).");
    }

    [Fact]
    public async Task Handle_WhenValidInput_ShouldCreatePendingJob()
    {
        // Arrange
        var userId = 20;
        _currentUserService.UserId.Returns(userId);

        var company = new Company
        {
            Id = 2,
            Code = "C2",
            Name = "Verified Corp",
            IsVerified = true // Verified company [BR-03]
        };
        
        var employer = new Employer
        {
            Id = 2,
            UserId = userId,
            CompanyId = 2,
            Company = company,
            Position = "HR Lead"
        };

        _context.Companies.Add(company);
        _context.Employers.Add(employer);
        await _context.SaveChangesAsync();

        var command = new CreateJobCommand(
            Title: "Senior .NET Dev",
            Description: "Description text that is sufficiently long and verbose.",
            Requirements: "Requirements text that is sufficiently long and verbose.",
            Benefits: "Remote work",
            SalaryFrom: 30000000,
            SalaryTo: 40000000,
            City: "TP. HCM",
            ExpiredAt: DateTime.Today.AddDays(30)
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Senior .NET Dev");
        result.Status.Should().Be(JobStatus.PENDING_REVIEW.ToString());

        var createdJob = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == result.Id);
        createdJob.Should().NotBeNull();
        createdJob!.Status.Should().Be(JobStatus.PENDING_REVIEW);
    }

    [Fact]
    public async Task Handle_ShouldSetAuditFields()
    {
        // Arrange
        var userId = 30;
        _currentUserService.UserId.Returns(userId);

        var company = new Company
        {
            Id = 3,
            Code = "C3",
            Name = "Audit Corp",
            IsVerified = true
        };
        
        var employer = new Employer
        {
            Id = 3,
            UserId = userId,
            CompanyId = 3,
            Company = company,
            Position = "Recruiter"
        };

        _context.Companies.Add(company);
        _context.Employers.Add(employer);
        await _context.SaveChangesAsync();

        var command = new CreateJobCommand(
            Title: "QA Automation Engineer",
            Description: "Sufficently long description text here.",
            Requirements: "Sufficiently long requirements text here.",
            Benefits: "Insurance",
            SalaryFrom: 20000000,
            SalaryTo: 25000000,
            City: "Đà Nẵng",
            ExpiredAt: DateTime.Today.AddDays(30)
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        var createdJob = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == result.Id);
        createdJob.Should().NotBeNull();
        createdJob!.EmployerId.Should().Be(employer.Id);
        createdJob.CreatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromSeconds(5));
    }
}
