using FluentAssertions;
using HR.Application.Companies.Commands.UpdateCompany;
using Xunit;

namespace HR.UnitTests.Companies.Commands.UpdateCompany;

public class UpdateCompanyValidatorTests
{
    private readonly UpdateCompanyValidator _validator;

    public UpdateCompanyValidatorTests()
    {
        _validator = new UpdateCompanyValidator();
    }

    [Fact]
    public void Validate_WhenLogoSizeExceeds2MB_ShouldHaveError()
    {
        // Arrange
        var command = new UpdateCompanyCommand(
            Id: 1,
            Name: "Company Test",
            LogoUrl: "https://example.com/large_file_logo.png", // simulated >2MB file URL
            BannerUrl: "https://example.com/banner.png",
            Description: "A valid company description text.",
            Website: "https://companytest.com",
            SizeRange: "10-50",
            Industry: "IT",
            AddressList: "Test address"
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "LogoUrl" && e.ErrorMessage == "CV_FILE_TOO_LARGE");
    }

    [Fact]
    public void Validate_WhenBannerNotImage_ShouldHaveError()
    {
        // Arrange
        var command = new UpdateCompanyCommand(
            Id: 1,
            Name: "Company Test",
            LogoUrl: "https://example.com/logo.png",
            BannerUrl: "https://example.com/banner_file.zip", // simulated invalid zip extension
            Description: "A valid company description text.",
            Website: "https://companytest.com",
            SizeRange: "10-50",
            Industry: "IT",
            AddressList: "Test address"
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BannerUrl" && e.ErrorMessage == "Định dạng ảnh bìa không hợp lệ.");
    }
}
