using FluentValidation;

namespace HR.Application.Interviews;

/// <summary>
/// Validator for EP-01: ScheduleInterviewCommand
/// Validation rules per API contract section 3.1
/// </summary>
public class ScheduleInterviewValidator : AbstractValidator<ScheduleInterviewCommand>
{
    public ScheduleInterviewValidator()
    {
        RuleFor(x => x.ApplicationId)
            .GreaterThan(0)
            .WithMessage("ID đơn ứng tuyển không hợp lệ.");

        RuleFor(x => x.StartTime)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("Thời gian bắt đầu phải lớn hơn thời điểm hiện tại. [BR-01]");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("Thời gian kết thúc phải sau thời gian bắt đầu.");

        RuleFor(x => x.InterviewType)
            .NotEmpty()
            .Must(x => x == "ONLINE" || x == "OFFLINE" || x == "PHONE")
            .WithMessage("Hình thức phỏng vấn phải là ONLINE, OFFLINE hoặc PHONE.");

        RuleFor(x => x.LocationOrLink)
            .NotEmpty()
            .WithMessage("Địa chỉ hoặc link họp không được để trống.")
            .MaximumLength(255)
            .WithMessage("Địa chỉ hoặc link họp tối đa 255 ký tự.");
    }
}

/// <summary>
/// Validator for EP-04: RespondInterviewCommand
/// Validation rules per API contract section 3.2
/// </summary>
public class RespondInterviewValidator : AbstractValidator<RespondInterviewCommand>
{
    public RespondInterviewValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("ID lịch phỏng vấn không hợp lệ.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .When(x => !x.Accept)
            .WithMessage("Vui lòng nhập lý do từ chối.");
    }
}
