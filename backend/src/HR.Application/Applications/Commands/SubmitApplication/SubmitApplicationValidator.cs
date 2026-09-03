using FluentValidation;

namespace HR.Application.Applications.Commands.SubmitApplication;

public class SubmitApplicationValidator : AbstractValidator<SubmitApplicationCommand>
{
    public SubmitApplicationValidator()
    {
        RuleFor(x => x.JobId)
            .GreaterThan(0)
            .WithMessage("ID tin tuyển dụng không hợp lệ.");

        RuleFor(x => x.CandidateCvId)
            .GreaterThan(0)
            .WithMessage("ID CV đính kèm không hợp lệ.");

        RuleFor(x => x.CoverLetter)
            .MaximumLength(3000)
            .WithMessage("Thư xin việc không được vượt quá 3000 ký tự.");
    }
}
