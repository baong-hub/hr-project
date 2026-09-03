using FluentValidation;

namespace HR.Application.UserSettings.Commands.UpdateTheme;

public class UpdateThemeValidator : AbstractValidator<UpdateThemeCommand>
{
    public UpdateThemeValidator()
    {
        RuleFor(x => x.ThemeMode).IsInEnum()
            .WithMessage("Theme mode không hợp lệ.");
    }
}

