using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using HR.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.BackgroundServices;

public class BackgroundServicesTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"HR_Test_Hangfire_{Guid.NewGuid():N}")
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task JobExpiryService_Should_Close_Only_Expired_Published_Jobs()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var logger = Substitute.For<ILogger<JobExpiryService>>();

        var now = DateTime.UtcNow;

        // Job 1: Published and expired -> SHOULD EXPIRE
        var expiredJob = new Job
        {
            Id = 1,
            Title = "Backend Dev Expired",
            CompanyId = 1,
            EmployerId = 1,
            Status = JobStatus.PUBLISHED,
            ExpiredAt = now.AddDays(-1)
        };

        // Job 2: Published but still active -> SHOULD NOT EXPIRE
        var activeJob = new Job
        {
            Id = 2,
            Title = "Frontend Dev Active",
            CompanyId = 1,
            EmployerId = 1,
            Status = JobStatus.PUBLISHED,
            ExpiredAt = now.AddDays(10)
        };

        // Job 3: Draft job expired -> SHOULD NOT EXPIRE (still draft)
        var draftJob = new Job
        {
            Id = 3,
            Title = "Design Job Draft",
            CompanyId = 1,
            EmployerId = 1,
            Status = JobStatus.DRAFT,
            ExpiredAt = now.AddDays(-5)
        };

        context.Jobs.AddRange(expiredJob, activeJob, draftJob);
        await context.SaveChangesAsync();

        var service = new JobExpiryService(context, logger);

        // Act
        var count = await service.CloseExpiredJobsAsync(CancellationToken.None);

        // Assert
        count.Should().Be(1);

        var updatedExpiredJob = await context.Jobs.FindAsync(1);
        updatedExpiredJob!.Status.Should().Be(JobStatus.EXPIRED);

        var updatedActiveJob = await context.Jobs.FindAsync(2);
        updatedActiveJob!.Status.Should().Be(JobStatus.PUBLISHED);

        var updatedDraftJob = await context.Jobs.FindAsync(3);
        updatedDraftJob!.Status.Should().Be(JobStatus.DRAFT);
    }

    [Fact]
    public async Task InterviewReminderService_Should_Send_Email_For_Upcoming_Interviews()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emailService = Substitute.For<IEmailService>();
        emailService.SendEmailAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(true));

        var logger = Substitute.For<ILogger<InterviewReminderService>>();

        var candidateUser = new User
        {
            Id = 101,
            Email = "candidate@test.local",
            FullName = "Nguyen Van A"
        };
        var candidate = new Candidate
        {
            Id = 10,
            UserId = candidateUser.Id,
            User = candidateUser
        };

        var employerUser = new User
        {
            Id = 201,
            Email = "interviewer@test.local",
            FullName = "Tran Thi B"
        };
        var employer = new Employer
        {
            Id = 20,
            UserId = employerUser.Id,
            User = employerUser
        };

        var company = new Company
        {
            Id = 1,
            Name = "HaMo Group"
        };

        var job = new Job
        {
            Id = 5,
            Title = "Tech Lead",
            CompanyId = company.Id,
            Company = company,
            EmployerId = employer.Id,
            Employer = employer
        };

        var app = new HR.Domain.Entities.Application
        {
            Id = 50,
            CandidateId = candidate.Id,
            Candidate = candidate,
            JobId = job.Id,
            Job = job
        };

        // Upcoming in 1 hour
        var interview = new Interview
        {
            Id = 1,
            ApplicationId = app.Id,
            Application = app,
            RoundName = "Vòng 1 - Phỏng vấn kỹ thuật",
            InterviewerId = employer.Id,
            Interviewer = employer,
            StartTime = DateTime.Now.AddHours(1),
            EndTime = DateTime.Now.AddHours(2),
            InterviewType = InterviewType.ONLINE,
            LocationOrLink = "https://meet.google.com/test",
            Status = InterviewStatus.INTERVIEW_SCHEDULED
        };

        context.Users.AddRange(candidateUser, employerUser);
        context.Candidates.Add(candidate);
        context.Employers.Add(employer);
        context.Companies.Add(company);
        context.Jobs.Add(job);
        context.Applications.Add(app);
        context.Interviews.Add(interview);
        await context.SaveChangesAsync();

        var service = new InterviewReminderService(context, emailService, logger);

        // Act
        var resultCount = await service.SendUpcomingInterviewRemindersAsync(CancellationToken.None);

        // Assert
        resultCount.Should().Be(1);
        await emailService.Received().SendEmailAsync(
            "candidate@test.local",
            Arg.Is<string>(s => s.Contains("Tech Lead")),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }
}
