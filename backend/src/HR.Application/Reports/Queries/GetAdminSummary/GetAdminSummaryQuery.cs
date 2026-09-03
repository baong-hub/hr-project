using HR.Application.Reports.Dtos;
using MediatR;

namespace HR.Application.Reports.Queries.GetAdminSummary;

public record GetAdminSummaryQuery : IRequest<AdminSummaryDto>;
