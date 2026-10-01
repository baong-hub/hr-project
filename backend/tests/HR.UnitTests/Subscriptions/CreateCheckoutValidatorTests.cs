using FluentValidation.TestHelper;
using HR.Application.Subscriptions.Commands.CreateCheckout;
using HR.Application.Subscriptions.Dtos;
using HR.Domain.Enums;
using Xunit;

namespace HR.UnitTests.Subscriptions;

public class CreateCheckoutValidatorTests
{
    private readonly CreateCheckoutValidator _validator = new();

    [Fact]
    public void Should_Have_Error_When_Request_Is_Null()
    {
        var command = new CreateCheckoutCommand(null!);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Request);
    }

    [Fact]
    public void Should_Have_Error_When_Plan_Is_Free()
    {
        var request = new CreateCheckoutRequest { Plan = SubscriptionPlan.FREE, Months = 1 };
        var command = new CreateCheckoutCommand(request);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Request.Plan);
    }

    [Fact]
    public void Should_Have_Error_When_Months_Is_Invalid()
    {
        var request = new CreateCheckoutRequest { Plan = SubscriptionPlan.PRO, Months = 0 };
        var command = new CreateCheckoutCommand(request);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Request.Months);
    }

    [Fact]
    public void Should_Pass_When_Command_Is_Valid()
    {
        var request = new CreateCheckoutRequest { Plan = SubscriptionPlan.PRO, Months = 12 };
        var command = new CreateCheckoutCommand(request);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
