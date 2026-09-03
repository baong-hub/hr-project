using FluentValidation;

namespace HR.Application.Notifications.Commands.MarkAsRead;

public class MarkAsReadCommandValidator : AbstractValidator<MarkAsReadCommand>
{
    public MarkAsReadCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("ID thông báo không hợp lệ.");
    }
}
