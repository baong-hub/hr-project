using MediatR;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.LogActivities.Queries.GetLogActivitiesStats;

public record GetLogActivitiesStatsQuery(
    int Days = 10,
    int? UserId = null
) : IRequest<ApiResponse<LogActivitiesStatsDto>>;

public class LogActivitiesStatsDto
{
    public long TotalCount { get; set; }
    public long ViewCount { get; set; }
    public long CreateCount { get; set; }
    public long UpdateCount { get; set; }
    public long DeleteCount { get; set; }
    
    public List<UserInteractionDto> UserStats { get; set; } = new();
    public List<SubsystemTrendDto> SubsystemTrends { get; set; } = new();
}

public class UserInteractionDto
{
    public int? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int CreateCount { get; set; }
    public int UpdateCount { get; set; }
    public int DeleteCount { get; set; }
    public int TotalCount => ViewCount + CreateCount + UpdateCount + DeleteCount;
}

public class SubsystemTrendDto
{
    public string SubsystemName { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int CreateCount { get; set; }
    public int UpdateCount { get; set; }
    public int DeleteCount { get; set; }
    public int TotalCount => ViewCount + CreateCount + UpdateCount + DeleteCount;
    public List<int> DailyTrend { get; set; } = new();
}

public class GetLogActivitiesStatsQueryHandler(IApplicationDbContext context) 
    : IRequestHandler<GetLogActivitiesStatsQuery, ApiResponse<LogActivitiesStatsDto>>
{
    public async Task<ApiResponse<LogActivitiesStatsDto>> Handle(GetLogActivitiesStatsQuery request, CancellationToken cancellationToken)
    {
        // 10 ngày gần nhất
        var today = DateTime.Today;
        var startDate = today.AddDays(-(request.Days - 1));

        var baseQuery = context.LogActivities.AsNoTracking();
        if (request.UserId.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.UserId == request.UserId.Value);
        }

        // Lấy tất cả logs trong 10 ngày qua
        var recentLogs = await baseQuery
            .Include(x => x.User)
                .ThenInclude(u => u!.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Where(x => x.CreatedAt >= startDate)
            .ToListAsync(cancellationToken);

        // 1. Tính tổng các loại hành động
        var stats = new LogActivitiesStatsDto
        {
            TotalCount = recentLogs.Count,
            ViewCount = recentLogs.Count(x => x.Action == "VIEW" || x.Action == "SEARCH" || x.Action == "LOGIN" || x.Action == "LOGOUT" || x.Action == "LOGIN_FAILED"),
            CreateCount = recentLogs.Count(x => x.Action == "CREATE"),
            UpdateCount = recentLogs.Count(x => x.Action == "UPDATE" || x.Action == "MERGE"),
            DeleteCount = recentLogs.Count(x => x.Action == "DELETE")
        };

        // 2. Thống kê theo nhân viên (Bảng đối soát tương tác)
        var userLogsGroup = recentLogs
            .GroupBy(x => x.UserId)
            .Select(g =>
            {
                var sampleLog = g.FirstOrDefault();
                var user = sampleLog?.User;
                var roleName = user?.UserRoles?.FirstOrDefault(ur => ur.Role != null)?.Role?.Name ?? "Nhân viên";

                var views = g.Count(x => x.Action == "VIEW" || x.Action == "SEARCH" || x.Action == "LOGIN" || x.Action == "LOGOUT" || x.Action == "LOGIN_FAILED");
                var creates = g.Count(x => x.Action == "CREATE");
                var updates = g.Count(x => x.Action == "UPDATE" || x.Action == "MERGE");
                var deletes = g.Count(x => x.Action == "DELETE");

                return new UserInteractionDto
                {
                    UserId = g.Key,
                    FullName = user?.FullName ?? "Hệ thống",
                    Email = user?.Email ?? "system@his.vn",
                    RoleName = roleName,
                    ViewCount = views,
                    CreateCount = creates,
                    UpdateCount = updates,
                    DeleteCount = deletes
                };
            })
            .OrderByDescending(x => x.TotalCount)
            .ToList();

        stats.UserStats = userLogsGroup;

        // 3. Thống kê xu hướng phân hệ (Sparklines)
        var subsystems = new List<(string Name, string Code, string[] Modules)>
        {
            ("Cơ hội (Leads)", "leads", new[] { "leads" }),
            ("Khách hàng (Customers)", "customers", new[] { "customers" }),
            ("Công việc (Tasks)", "lead_tasks", new[] { "lead_tasks", "crm_task_types" }),
            ("Nhật ký tương tác (Interaction Logs)", "interaction_logs", new[] { "interaction_logs" }),
            ("Tổng đài & Cài đặt (Call Center)", "call_center", new[] { "call_logs", "user_extensions", "setting_configs" }),
            ("Xác thực & Hệ thống (Auth)", "auth", new[] { "auth" })
        };

        foreach (var sub in subsystems)
        {
            var subLogs = recentLogs.Where(x => sub.Modules.Contains(x.ModuleName)).ToList();

            var views = subLogs.Count(x => x.Action == "VIEW" || x.Action == "SEARCH" || x.Action == "LOGIN" || x.Action == "LOGOUT" || x.Action == "LOGIN_FAILED");
            var creates = subLogs.Count(x => x.Action == "CREATE");
            var updates = subLogs.Count(x => x.Action == "UPDATE" || x.Action == "MERGE");
            var deletes = subLogs.Count(x => x.Action == "DELETE");

            var trendDto = new SubsystemTrendDto
            {
                SubsystemName = sub.Name,
                ModuleName = sub.Code,
                ViewCount = views,
                CreateCount = creates,
                UpdateCount = updates,
                DeleteCount = deletes
            };

            // Tạo sparkline 10 ngày
            for (int i = 0; i < request.Days; i++)
            {
                var day = startDate.AddDays(i);
                var dayCount = subLogs.Count(x => x.CreatedAt.Date == day.Date);
                trendDto.DailyTrend.Add(dayCount);
            }

            stats.SubsystemTrends.Add(trendDto);
        }

        return ApiResponse<LogActivitiesStatsDto>.Ok(stats);
    }
}

