using HR.Application.Reports.Dtos;
using MediatR;

namespace HR.Application.Reports.Queries.GetRecruitmentFunnel;

public record GetRecruitmentFunnelQuery : IRequest<RecruitmentFunnelDto>;
