using FluentValidation;

namespace HR.Application.Cvs.Commands.UpdateProfile;

public class UpdateProfileValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileValidator()
    {
        RuleFor(x => x.Skills)
            .MaximumLength(500).WithMessage("Kỹ năng không được vượt quá 500 ký tự.");

        RuleFor(x => x.ExperienceSummary)
            .MaximumLength(4000).WithMessage("Tóm tắt kinh nghiệm không được vượt quá 4000 ký tự.");

        RuleFor(x => x.VisibilityStatus)
            .NotEmpty().WithMessage("Trạng thái hiển thị không được để trống.")
            .Must(status => status == "PUBLIC" || status == "PRIVATE")
            .WithMessage("Trạng thái hiển thị phải là PUBLIC hoặc PRIVATE.");
    }
}
