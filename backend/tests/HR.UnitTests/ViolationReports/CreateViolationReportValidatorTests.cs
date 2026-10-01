using FluentValidation.TestHelper;
using HR.Application.ViolationReports.Commands.CreateViolationReport;
using HR.Application.ViolationReports.Dtos;
using HR.Domain.Enums;
using Xunit;

namespace HR.UnitTests.ViolationReports;

public class CreateViolationReportValidatorTests
{
    private readonly CreateViolationReportValidator _validator = new();

    [Fact]
    public void Should_Have_Error_When_Reason_Is_Empty()
    {
        var request = new CreateViolationReportRequest
        {
            TargetId = 1,
            TargetType = ViolationTargetType.JOB,
            Reason = ""
        };
        var command = new CreateViolationReportCommand(request);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Request.Reason);
    }

    [Fact]
    public void Should_Have_Error_When_TargetId_Is_Zero()
    {
        var request = new CreateViolationReportRequest
        {
            TargetId = 0,
            TargetType = ViolationTargetType.JOB,
            Reason = "Tin đăng lừa đảo"
        };
        var command = new CreateViolationReportCommand(request);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Request.TargetId);
    }

    [Fact]
    public void Should_Pass_When_Request_Is_Valid()
    {
        var request = new CreateViolationReportRequest
        {
            TargetId = 10,
            TargetType = ViolationTargetType.COMPANY,
            Reason = "Thông tin công ty mạo danh",
            Description = "Công ty này không đúng địa chỉ đăng ký kinh doanh."
        };
        var command = new CreateViolationReportCommand(request);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
