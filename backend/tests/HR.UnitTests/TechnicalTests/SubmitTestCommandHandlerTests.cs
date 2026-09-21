using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.TechnicalTests.Commands.SubmitTest;
using HR.Application.TechnicalTests.Models;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;
using ApplicationEntity = HR.Domain.Entities.Application;

namespace HR.UnitTests.TechnicalTests;

public class SubmitTestCommandHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationSender _notificationSender;
    private readonly IEmailService _emailService;
    private readonly ICurrentUserService _currentUserService;
    private readonly SubmitTestCommandHandler _handler;

    public SubmitTestCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _notificationSender = Substitute.For<INotificationSender>();
        _emailService = Substitute.For<IEmailService>();
        _currentUserService = Substitute.For<ICurrentUserService>();

        _handler = new SubmitTestCommandHandler(
            _context,
            _notificationSender,
            _emailService,
            _currentUserService
        );
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Handle_WhenTestDoesNotExist_ShouldThrowNotFoundException()
    {
        // Act
        var act = () => _handler.Handle(new SubmitTestCommand(999, new List<SubmitAnswerItem>()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenTestAlreadyCompleted_ShouldThrowBadRequestException()
    {
        var user = new User { Id = 1, Email = "test@c.com", FullName = "Candidate" };
        var candidate = new Candidate { Id = 1, UserId = 1, User = user };
        var company = new Company { Id = 1, Name = "Company" };
        var job = new Job { Id = 1, Title = "Title", Company = company, CompanyId = 1 };
        var application = new ApplicationEntity { Id = 1, Candidate = candidate, CandidateId = 1, Job = job, JobId = 1 };

        var test = new TechnicalTest
        {
            Id = 1,
            Application = application,
            ApplicationId = 1,
            Status = TechnicalTestStatus.PASSED,
            Score = 90
        };
        _context.TechnicalTests.Add(test);
        await _context.SaveChangesAsync();

        // Act
        var act = () => _handler.Handle(new SubmitTestCommand(1, new List<SubmitAnswerItem>()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("*đã được nộp*");
    }

    [Fact]
    public async Task Handle_WhenValidTestSubmitted_ShouldCalculateScoreAndSaveResult()
    {
        // Arrange
        var questionsJson = @"[
            {
                ""Id"": 1,
                ""Question"": ""What is C#?"",
                ""Options"": [
                    ""Programming language"",
                    ""Coffee brand""
                ],
                ""CorrectOptionIndex"": 0
            }
        ]";

        var user = new User { Id = 10, Email = "cand@test.com", FullName = "Candidate One" };
        var candidate = new Candidate { Id = 5, UserId = 10, User = user };
        var company = new Company { Id = 1, Name = "Tech Corp" };
        var job = new Job { Id = 1, Title = "Software Engineer", Company = company, CompanyId = 1 };
        var application = new ApplicationEntity { Id = 20, Candidate = candidate, CandidateId = 5, Job = job, JobId = 1 };

        var test = new TechnicalTest
        {
            Id = 50,
            Application = application,
            ApplicationId = 20,
            Status = TechnicalTestStatus.IN_PROGRESS,
            QuestionsData = questionsJson,
            PassingScore = 50
        };
        _context.TechnicalTests.Add(test);
        await _context.SaveChangesAsync();

        var answers = new List<SubmitAnswerItem>
        {
            new SubmitAnswerItem { QuestionId = 1, SelectedOptionIndex = 0 } // Correct answer
        };

        // Act
        var response = await _handler.Handle(new SubmitTestCommand(50, answers), CancellationToken.None);

        // Assert
        response.Success.Should().BeTrue();
        response.Data.Should().NotBeNull();
        response.Data!.Score.Should().Be(100);
        response.Data.TotalQuestions.Should().Be(1);
        response.Data.CorrectCount.Should().Be(1);
        response.Data.IsPassed.Should().BeTrue();

        var updated = await _context.TechnicalTests.FindAsync(50);
        updated!.Status.Should().Be(TechnicalTestStatus.PASSED);
    }
}
