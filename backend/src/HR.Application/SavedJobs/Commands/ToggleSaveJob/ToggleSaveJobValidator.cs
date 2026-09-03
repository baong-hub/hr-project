using FluentValidation;

namespace HR.Application.SavedJobs.Commands.ToggleSaveJob;

public class ToggleSaveJobValidator : AbstractValidator<ToggleSaveJobCommand>
{
    public ToggleSaveJobValidator()
    {
        RuleFor(x => x.JobId)
            .GreaterThan(0)
            .WithMessage("ID tin tuyển dụng không hợp lệ.");
    }
}
