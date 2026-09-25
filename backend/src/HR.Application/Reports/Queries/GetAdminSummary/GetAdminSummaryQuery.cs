using HR.Application.Reports.Dtos;
using MediatR;

namespace HR.Application.Reports.Queries.GetAdminSummary;

public record GetAdminSummaryQuery(
    string? From = null,
    string? To = null,
    string? Range = null
) : IRequest<AdminSummaryDto>;
