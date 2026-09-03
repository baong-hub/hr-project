using MediatR;

namespace HR.Application.Dashboard;

public record GetDashboardStatsQuery() : IRequest<DashboardStatsDto>;
