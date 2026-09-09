using HR.Application.Reports.Dtos;
using MediatR;

namespace HR.Application.Reports.Queries.GetRecruitmentFunnel;

public record GetRecruitmentFunnelQuery(
    string? From = null,
    string? To = null
) : IRequest<RecruitmentFunnelDto>;
