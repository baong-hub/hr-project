using FluentValidation;
using HR.Domain.Enums;
using System;

namespace HR.Application.Jobs.Commands.ChangeJobStatus;

public class ChangeJobStatusValidator : AbstractValidator<ChangeJobStatusCommand>
{
    public ChangeJobStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái không được để trống.")
            .Must(status => Enum.TryParse<JobStatus>(status, true, out _))
            .WithMessage("Trạng thái công việc không hợp lệ.");

        RuleFor(x => x.Note)
            .NotEmpty()
            .When(x => string.Equals(x.Status, "REJECTED", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Lý do từ chối (note) là bắt buộc khi từ chối tin đăng.");
    }
}
