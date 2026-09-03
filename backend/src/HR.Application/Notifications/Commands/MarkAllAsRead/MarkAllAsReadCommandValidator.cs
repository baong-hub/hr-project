using FluentValidation;

namespace HR.Application.Notifications.Commands.MarkAllAsRead;

public class MarkAllAsReadCommandValidator : AbstractValidator<MarkAllAsReadCommand>
{
    public MarkAllAsReadCommandValidator()
    {
        // No input parameters to validate, command acts on current logged-in user
    }
}
