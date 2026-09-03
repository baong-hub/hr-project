using System;
using FluentValidation;

namespace HR.Application.Reports.Queries.GetEmployerSummary;

public class GetEmployerSummaryQueryValidator : AbstractValidator<GetEmployerSummaryQuery>
{
    public GetEmployerSummaryQueryValidator()
    {
        RuleFor(x => x.From)
            .Must(BeValidDate)
            .WithMessage("Ngày bắt đầu không đúng định dạng YYYY-MM-DD")
            .When(x => !string.IsNullOrEmpty(x.From));

        RuleFor(x => x.To)
            .Must(BeValidDate)
            .WithMessage("Ngày kết thúc không đúng định dạng YYYY-MM-DD")
            .When(x => !string.IsNullOrEmpty(x.To));
    }

    private bool BeValidDate(string? dateStr)
    {
        return DateTime.TryParse(dateStr, out _);
    }
}
