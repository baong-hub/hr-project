using FluentValidation.TestHelper;
using Xunit;
using HR.Application.Auth.Commands.RegisterCandidate;
using HR.Application.Auth.Commands.RegisterEmployer;

namespace HR.UnitTests.Authentication.Commands;

public class RegisterValidatorTests
{
    private readonly RegisterCandidateValidator _candidateValidator;
    private readonly RegisterEmployerValidator _employerValidator;

    public RegisterValidatorTests()
    {
        _candidateValidator = new RegisterCandidateValidator();
        _employerValidator = new RegisterEmployerValidator();
    }

    [Fact]
    public void Validate_WhenEmailInvalid_ShouldHaveError()
    {
        // Arrange
        var candidateCommand = new RegisterCandidateCommand(
            Email: "invalidemail",
            Password: "Password123",
            PhoneNumber: "0901234567",
            FullName: "Candidate Name"
        );

        var employerCommand = new RegisterEmployerCommand(
            Email: "invalidemail",
            Password: "Password123",
            FullName: "Employer Name",
            PhoneNumber: "0912345678",
            Position: "HR",
            CompanyName: "Company Name"
        );

        // Act
        var candidateResult = _candidateValidator.TestValidate(candidateCommand);
        var employerResult = _employerValidator.TestValidate(employerCommand);

        // Assert
        candidateResult.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email không hợp lệ");

        employerResult.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email không hợp lệ");
    }

    [Fact]
    public void Validate_WhenPasswordWeak_ShouldHaveError()
    {
        // Arrange
        var candidateCommand = new RegisterCandidateCommand(
            Email: "candidate@example.com",
            Password: "123", // Weak
            PhoneNumber: "0901234567",
            FullName: "Candidate Name"
        );

        var employerCommand = new RegisterEmployerCommand(
            Email: "employer@example.com",
            Password: "123", // Weak
            FullName: "Employer Name",
            PhoneNumber: "0912345678",
            Position: "HR",
            CompanyName: "Company Name"
        );

        // Act
        var candidateResult = _candidateValidator.TestValidate(candidateCommand);
        var employerResult = _employerValidator.TestValidate(employerCommand);

        // Assert
        candidateResult.ShouldHaveValidationErrorFor(x => x.Password);
        employerResult.ShouldHaveValidationErrorFor(x => x.Password);
    }
}
