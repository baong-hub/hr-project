using FluentValidation;

namespace HR.Application.ViolationReports.Commands.CreateViolationReport;

public class CreateViolationReportValidator : AbstractValidator<CreateViolationReportCommand>
{
    public CreateViolationReportValidator()
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Yêu cầu báo cáo vi phạm không được để trống.");
        When(x => x.Request != null, () =>
        {
            RuleFor(x => x.Request.TargetId).GreaterThan(0).WithMessage("ID đối tượng báo cáo không hợp lệ.");
            RuleFor(x => x.Request.Reason)
                .NotEmpty().WithMessage("Lý do báo cáo vi phạm không được để trống.")
                .MaximumLength(255).WithMessage("Lý do báo cáo vi phạm không được vượt quá 255 ký tự.");
            RuleFor(x => x.Request.Description)
                .MaximumLength(1000).WithMessage("Mô tả vi phạm không được vượt quá 1000 ký tự.");
        });
    }
}
