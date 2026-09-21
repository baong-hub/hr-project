using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HR.Application.Common.Interfaces;
using HR.Application.Subscriptions.Commands.HandlePaymentWebhook;
using HR.Application.Subscriptions.Dtos;
using HR.Application.Subscriptions.Queries.GetAvailablePlans;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace HR.UnitTests.Subscriptions;

public class SubscriptionsTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public SubscriptionsTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _emailService = Substitute.For<IEmailService>();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GetAvailablePlansQuery_ShouldReturn4PlansWithCorrectPricing()
    {
        // Arrange
        var handler = new GetAvailablePlansQueryHandler();

        // Act
        var plans = await handler.Handle(new GetAvailablePlansQuery(), CancellationToken.None);

        // Assert
        plans.Should().HaveCount(4);
        plans.Should().Contain(p => p.Plan == SubscriptionPlan.FREE && p.MonthlyPriceVnd == 0 && p.MaxJobs == 3);
        plans.Should().Contain(p => p.Plan == SubscriptionPlan.PRO && p.MonthlyPriceVnd == 1990000 && p.AiScreening);
        plans.Should().Contain(p => p.Plan == SubscriptionPlan.BUSINESS && p.MonthlyPriceVnd == 4990000);
        plans.Should().Contain(p => p.Plan == SubscriptionPlan.ENTERPRISE && p.MonthlyPriceVnd == 9990000 && p.MaxJobs == 9999);
    }

    [Fact]
    public async Task HandlePaymentWebhook_WithPaidStatus_ShouldActivateSubscription()
    {
        // Arrange
        var company = new Company { Id = 10, Name = "Tech Corp" };
        _context.Companies.Add(company);

        var user = new User { Id = 101, Email = "hr@techcorp.com", FullName = "HR Manager" };
        _context.Users.Add(user);

        var employer = new Employer { Id = 1, UserId = 101, CompanyId = 10 };
        _context.Employers.Add(employer);

        await _context.SaveChangesAsync();

        var handler = new HandlePaymentWebhookCommandHandler(_context, _emailService);
        var webhook = new PaymentWebhookRequest
        {
            OrderId = "HR_SUB_10_123456789_PRO",
            Amount = 1990000,
            Status = "PAID"
        };

        // Act
        var result = await handler.Handle(new HandlePaymentWebhookCommand(webhook), CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        var sub = await _context.CompanySubscriptions.FirstOrDefaultAsync(s => s.CompanyId == 10);
        sub.Should().NotBeNull();
        sub!.PlanName.Should().Be(SubscriptionPlan.PRO);
        sub.MaxJobs.Should().Be(15);
    }
}
