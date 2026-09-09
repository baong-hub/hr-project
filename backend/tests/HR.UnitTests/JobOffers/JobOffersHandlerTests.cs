using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.JobOffers.Commands.CreateJobOffer;
using HR.Application.JobOffers.Commands.RespondJobOffer;
using HR.Application.JobOffers.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.JobOffers;

public class JobOffersHandlerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;
    private readonly INotificationSender _notificationSender;

    public JobOffersHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _currentUserService = Substitute.For<ICurrentUserService>();
        _emailService = Substitute.For<IEmailService>();
        _notificationSender = Substitute.For<INotificationSender>();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateJobOffer_ValidRequest_ShouldCreateOfferAndTransitionApplicationToOffer()
    {
        // Arrange
        var employerUserId = 100;
        _currentUserService.UserId.Returns(employerUserId);

        var company = new Company { Id = 1, Name = "VNG Tech" };
        var candidateUser = new User { Id = 200, Email = "candidate@example.com", FullName = "Le Van C" };
        var candidate = new Candidate { Id = 200, UserId = 200, FullName = "Le Van C", User = candidateUser };
        var employer = new Employer { Id = 10, UserId = employerUserId, CompanyId = 1 };
        var job = new Job { Id = 5, CompanyId = 1, EmployerId = 10, Title = "Senior Frontend Engineer", Company = company };
        var application = new HR.Domain.Entities.Application { Id = 50, JobId = 5, CandidateId = 200, Status = ApplicationStatus.INTERVIEW, Job = job, Candidate = candidate };

        _context.Companies.Add(company);
        _context.Users.Add(candidateUser);
        _context.Candidates.Add(candidate);
        _context.Employers.Add(employer);
        _context.Jobs.Add(job);
        _context.Applications.Add(application);
        await _context.SaveChangesAsync();

        var handler = new CreateJobOfferCommandHandler(_context, _currentUserService, _emailService, _notificationSender);

        var request = new CreateJobOfferRequest
        {
            ApplicationId = 50,
            PositionTitle = "Senior Frontend Engineer",
            BasicSalary = 35000000,
            Allowance = 2000000,
            SalaryType = OfferSalaryType.GROSS,
            Currency = "VND",
            ProbationPeriodMonths = 2,
            ProbationSalaryPercentage = 85,
            StartDate = DateTime.Now.AddDays(14),
            ExpiryDate = DateTime.Now.AddDays(7),
            WorkLocation = "Tòa nhà VNG Campus, Q7, TP.HCM",
            Benefits = "MacBook Pro M3, BHXH đầy đủ, Premium Healthcare"
        };

        // Act
        var result = await handler.Handle(new CreateJobOfferCommand(request), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.BasicSalary.Should().Be(35000000);
        result.TotalSalary.Should().Be(37000000);
        result.ProbationSalary.Should().Be((35000000m * 85m / 100m) + 2000000m);
        result.Status.Should().Be(JobOfferStatus.PENDING);

        // Verify Application status updated to OFFER
        var updatedApp = await _context.Applications.FindAsync(50);
        updatedApp!.Status.Should().Be(ApplicationStatus.OFFER);

        // Verify notification sent
        await _notificationSender.Received(1).SendNotificationAsync(
            200,
            Arg.Is<string>(s => s.Contains("Thư Mời Nhận Việc")),
            Arg.Any<string>(),
            NotificationType.OFFER_RECEIVED,
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RespondJobOffer_Accept_ShouldSetOfferAcceptedAndApplicationHired()
    {
        // Arrange
        var candidateUserId = 200;
        _currentUserService.UserId.Returns(candidateUserId);

        var company = new Company { Id = 1, Name = "VNG Tech" };
        var candidateUser = new User { Id = candidateUserId, Email = "candidate@example.com", FullName = "Le Van C" };
        var candidate = new Candidate { Id = candidateUserId, UserId = candidateUserId, FullName = "Le Van C", User = candidateUser };
        var employerUser = new User { Id = 100, Email = "recruiter@example.com", FullName = "Recruiter HR" };
        var employer = new Employer { Id = 10, UserId = 100, CompanyId = 1, User = employerUser };
        var job = new Job { Id = 5, CompanyId = 1, EmployerId = 10, Title = "Senior Frontend Engineer", Company = company };
        var application = new HR.Domain.Entities.Application { Id = 50, JobId = 5, CandidateId = candidateUserId, Status = ApplicationStatus.OFFER, Job = job, Candidate = candidate };

        var offer = new JobOffer
        {
            Id = 1,
            ApplicationId = 50,
            JobId = 5,
            CandidateId = candidateUserId,
            CreatedByEmployerId = 10,
            PositionTitle = "Senior Frontend Engineer",
            BasicSalary = 35000000,
            SalaryType = OfferSalaryType.GROSS,
            StartDate = DateTime.Now.AddDays(14),
            ExpiryDate = DateTime.Now.AddDays(7),
            Status = JobOfferStatus.PENDING,
            Application = application,
            Job = job,
            Candidate = candidate,
            CreatedByEmployer = employer
        };

        _context.Companies.Add(company);
        _context.Users.AddRange(candidateUser, employerUser);
        _context.Candidates.Add(candidate);
        _context.Employers.Add(employer);
        _context.Jobs.Add(job);
        _context.Applications.Add(application);
        _context.JobOffers.Add(offer);
        await _context.SaveChangesAsync();

        var handler = new RespondJobOfferCommandHandler(_context, _currentUserService, _emailService, _notificationSender);

        var request = new RespondJobOfferRequest
        {
            Action = "ACCEPT",
            Note = "Tôi rất vinh dự được gia nhập đội ngũ!"
        };

        // Act
        var result = await handler.Handle(new RespondJobOfferCommand(1, request), CancellationToken.None);

        // Assert
        result.Status.Should().Be(JobOfferStatus.ACCEPTED);
        result.CandidateResponseNote.Should().Be("Tôi rất vinh dự được gia nhập đội ngũ!");

        var updatedApp = await _context.Applications.FindAsync(50);
        updatedApp!.Status.Should().Be(ApplicationStatus.HIRED);

        await _notificationSender.Received(1).SendNotificationAsync(
            100,
            Arg.Is<string>(s => s.Contains("ĐỒNG Ý nhận việc")),
            Arg.Any<string>(),
            NotificationType.OFFER_ACCEPTED,
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RespondJobOffer_Negotiate_ShouldSetOfferNegotiating()
    {
        // Arrange
        var candidateUserId = 200;
        _currentUserService.UserId.Returns(candidateUserId);

        var company = new Company { Id = 1, Name = "VNG Tech" };
        var candidateUser = new User { Id = candidateUserId, Email = "candidate@example.com", FullName = "Le Van C" };
        var candidate = new Candidate { Id = candidateUserId, UserId = candidateUserId, FullName = "Le Van C", User = candidateUser };
        var employerUser = new User { Id = 100, Email = "recruiter@example.com", FullName = "Recruiter HR" };
        var employer = new Employer { Id = 10, UserId = 100, CompanyId = 1, User = employerUser };
        var job = new Job { Id = 5, CompanyId = 1, EmployerId = 10, Title = "Senior Frontend Engineer", Company = company };
        var application = new HR.Domain.Entities.Application { Id = 50, JobId = 5, CandidateId = candidateUserId, Status = ApplicationStatus.OFFER, Job = job, Candidate = candidate };

        var offer = new JobOffer
        {
            Id = 2,
            ApplicationId = 50,
            JobId = 5,
            CandidateId = candidateUserId,
            CreatedByEmployerId = 10,
            PositionTitle = "Senior Frontend Engineer",
            BasicSalary = 35000000,
            SalaryType = OfferSalaryType.GROSS,
            StartDate = DateTime.Now.AddDays(14),
            ExpiryDate = DateTime.Now.AddDays(7),
            Status = JobOfferStatus.PENDING,
            Application = application,
            Job = job,
            Candidate = candidate,
            CreatedByEmployer = employer
        };

        _context.Companies.Add(company);
        _context.Users.AddRange(candidateUser, employerUser);
        _context.Candidates.Add(candidate);
        _context.Employers.Add(employer);
        _context.Jobs.Add(job);
        _context.Applications.Add(application);
        _context.JobOffers.Add(offer);
        await _context.SaveChangesAsync();

        var handler = new RespondJobOfferCommandHandler(_context, _currentUserService, _emailService, _notificationSender);

        var request = new RespondJobOfferRequest
        {
            Action = "NEGOTIATE",
            DesiredSalary = 40000000,
            Note = "Mong muốn thương lượng nâng mức lương cứng lên 40M Gross."
        };

        // Act
        var result = await handler.Handle(new RespondJobOfferCommand(2, request), CancellationToken.None);

        // Assert
        result.Status.Should().Be(JobOfferStatus.NEGOTIATING);
        result.CandidateDesiredSalary.Should().Be(40000000);
        result.CandidateResponseNote.Should().Be("Mong muốn thương lượng nâng mức lương cứng lên 40M Gross.");
    }
}
