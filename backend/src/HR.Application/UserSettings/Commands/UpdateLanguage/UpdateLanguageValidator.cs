using FluentValidation;

namespace HR.Application.UserSettings.Commands.UpdateLanguage;

public class UpdateLanguageValidator : AbstractValidator<UpdateLanguageCommand>
{
    public UpdateLanguageValidator()
    {
        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Ngôn ngữ không được để trống.")
            .Must(lang => lang == "vi" || lang == "en").WithMessage("Ngôn ngữ không hợp lệ. Chỉ hỗ trợ Tiếng Việt (vi) hoặc Tiếng Anh (en).");
    }
}

