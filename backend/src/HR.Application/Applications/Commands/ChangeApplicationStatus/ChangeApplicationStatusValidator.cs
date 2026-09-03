using FluentValidation;
using HR.Domain.Enums;
using System;

namespace HR.Application.Applications.Commands.ChangeApplicationStatus;

public class ChangeApplicationStatusValidator : AbstractValidator<ChangeApplicationStatusCommand>
{
    public ChangeApplicationStatusValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("ID đơn ứng tuyển không hợp lệ.");

        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(status => Enum.TryParse<ApplicationStatus>(status, true, out _))
            .WithMessage("Trạng thái ứng tuyển không hợp lệ.");
    }
}
