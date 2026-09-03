using System.IO;
using FluentValidation.TestHelper;
using HR.Application.Cvs.Commands.UploadCv;
using Xunit;

namespace HR.UnitTests.Cvs.Commands.UploadCv;

public class UploadCvValidatorTests
{
    private readonly UploadCvValidator _validator;

    public class MockStream : MemoryStream
    {
    }

    public UploadCvValidatorTests()
    {
        _validator = new UploadCvValidator();
    }

    [Fact]
    public void Validate_WhenTitleIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UploadCvCommand(
            CvTitle: "",
            FileContent: new MockStream(),
            FileName: "mycv.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: 100
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CvTitle)
            .WithErrorMessage("Tiêu đề CV không được để trống.");
    }

    [Fact]
    public void Validate_WhenTitleExceeds100Chars_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UploadCvCommand(
            CvTitle: new string('a', 101),
            FileContent: new MockStream(),
            FileName: "mycv.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: 100
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CvTitle)
            .WithErrorMessage("Tiêu đề CV không được vượt quá 100 ký tự.");
    }

    [Fact]
    public void Validate_WhenFileContentIsNull_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UploadCvCommand(
            CvTitle: "Valid Title",
            FileContent: null!,
            FileName: "mycv.pdf",
            ContentType: "application/pdf",
            FileSizeBytes: 100
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FileContent)
            .WithErrorMessage("Dữ liệu tệp CV không được để trống.");
    }
}
