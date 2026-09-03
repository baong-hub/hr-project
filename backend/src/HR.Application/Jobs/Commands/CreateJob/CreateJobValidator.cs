using FluentValidation;
using System;

namespace HR.Application.Jobs.Commands.CreateJob;

public class CreateJobValidator : AbstractValidator<CreateJobCommand>
{
    public CreateJobValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề không được để trống.")
            .MaximumLength(150).WithMessage("Tiêu đề không quá 150 ký tự.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Mô tả công việc không được để trống.");

        RuleFor(x => x.Requirements)
            .NotEmpty().WithMessage("Yêu cầu công việc không được để trống.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Thành phố không được để trống.")
            .MaximumLength(50).WithMessage("Thành phố không quá 50 ký tự.");

        RuleFor(x => x.SalaryFrom)
            .GreaterThanOrEqualTo(0).WithMessage("Lương tối thiểu phải >= 0.")
            .LessThanOrEqualTo(x => x.SalaryTo)
            .When(x => x.SalaryFrom.HasValue && x.SalaryTo.HasValue)
            .WithMessage("Lương tối thiểu không được lớn hơn lương tối đa.");

        RuleFor(x => x.SalaryTo)
            .GreaterThanOrEqualTo(0).WithMessage("Lương tối đa phải >= 0.");

        RuleFor(x => x.ExpiredAt)
            .Must(date => date >= DateTime.Today.AddDays(7) && date <= DateTime.Today.AddDays(90))
            .WithMessage("Hạn ứng tuyển phải nằm trong khoảng từ 7 đến 90 ngày kể từ hôm nay.");
    }
}
