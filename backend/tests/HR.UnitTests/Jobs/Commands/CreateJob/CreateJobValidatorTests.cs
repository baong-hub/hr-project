using System;
using FluentAssertions;
using HR.Application.Jobs.Commands.CreateJob;
using Xunit;

namespace HR.UnitTests.Jobs.Commands.CreateJob;

public class CreateJobValidatorTests
{
    private readonly CreateJobValidator _validator;

    public CreateJobValidatorTests()
    {
        _validator = new CreateJobValidator();
    }

    [Fact]
    public void Validate_WhenSalaryMinGreaterThanMax_ShouldHaveError()
    {
        // Arrange
        var command = new CreateJobCommand(
            Title: "QA Engineer",
            Description: "Standard description with at least fifty characters requirement.",
            Requirements: "Standard requirements with at least fifty characters requirement.",
            Benefits: "Gym membership",
            SalaryFrom: 25000000,
            SalaryTo: 20000000, // min > max [BR-01]
            City: "Hà Nội",
            ExpiredAt: DateTime.Today.AddDays(30)
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "SalaryFrom" && e.ErrorMessage == "Lương tối thiểu không được lớn hơn lương tối đa.");
    }

    [Fact]
    public void Validate_WhenExpiredAtTooShort_ShouldHaveError()
    {
        // Arrange
        var command = new CreateJobCommand(
            Title: "Standard Java Dev",
            Description: "Standard description with at least fifty characters requirement.",
            Requirements: "Standard requirements with at least fifty characters requirement.",
            Benefits: "Gym membership",
            SalaryFrom: 15000000,
            SalaryTo: 20000000,
            City: "Hà Nội",
            ExpiredAt: DateTime.Today.AddDays(5) // Too short, < 7 days [BR-02]
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ExpiredAt" && e.ErrorMessage.Contains("Hạn ứng tuyển phải nằm trong khoảng từ 7 đến 90 ngày"));
    }

    [Fact]
    public void Validate_WhenExpiredAtTooLong_ShouldHaveError()
    {
        // Arrange
        var command = new CreateJobCommand(
            Title: "Standard Python Dev",
            Description: "Standard description with at least fifty characters requirement.",
            Requirements: "Standard requirements with at least fifty characters requirement.",
            Benefits: "Gym membership",
            SalaryFrom: 15000000,
            SalaryTo: 20000000,
            City: "Hà Nội",
            ExpiredAt: DateTime.Today.AddDays(95) // Too long, > 90 days [BR-02]
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ExpiredAt" && e.ErrorMessage.Contains("Hạn ứng tuyển phải nằm trong khoảng từ 7 đến 90 ngày"));
    }

    [Fact]
    public void Validate_WhenTitleEmpty_ShouldHaveError()
    {
        // Arrange
        var command = new CreateJobCommand(
            Title: "", // Empty Title
            Description: "Standard description with at least fifty characters requirement.",
            Requirements: "Standard requirements with at least fifty characters requirement.",
            Benefits: "Gym membership",
            SalaryFrom: 15000000,
            SalaryTo: 20000000,
            City: "Hà Nội",
            ExpiredAt: DateTime.Today.AddDays(30)
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Title" && e.ErrorMessage == "Tiêu đề không được để trống.");
    }
}
