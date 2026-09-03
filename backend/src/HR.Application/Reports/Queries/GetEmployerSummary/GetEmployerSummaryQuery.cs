using HR.Application.Reports.Dtos;
using MediatR;

namespace HR.Application.Reports.Queries.GetEmployerSummary;

public record GetEmployerSummaryQuery(
    string? From,
    string? To
) : IRequest<EmployerSummaryDto>;
