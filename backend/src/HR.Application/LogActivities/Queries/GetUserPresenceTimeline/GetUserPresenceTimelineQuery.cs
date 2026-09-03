using MediatR;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.LogActivities.Queries.GetUserPresenceTimeline;

public record GetUserPresenceTimelineQuery(
    int? SelectedUserId = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null
) : IRequest<ApiResponse<UserPresenceTimelineDto>>;

public class UserPresenceTimelineDto
{
    public List<UserPresenceStatusDto> UserStatuses { get; set; } = new();
    public List<UserPresenceLogDto> SelectedUserTimeline { get; set; } = new();
    public double TotalOnlineHoursToday { get; set; }
    public List<int> HourlyMaxTabs { get; set; } = new();
}

public class UserPresenceStatusDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public bool IsOnline { get; set; }
    public int CurrentTabCount { get; set; }
    public string DepartmentName { get; set; } = "Chưa phân bộ phận";
    public int DepartmentId { get; set; } = 0;
    public string AgentStatus { get; set; } = "Offline";
    public string? PauseReason { get; set; }
}

public class UserPresenceLogDto
{
    public int Id { get; set; }
    public DateTime LoginTime { get; set; }
    public DateTime? LogoutTime { get; set; }
    public int TabCount { get; set; }
    public int CurrentTabCount { get; set; }
    public int DurationSeconds { get; set; }
}

public class GetUserPresenceTimelineQueryHandler(
    IApplicationDbContext context,
    IUserPresenceService presenceService
) : IRequestHandler<GetUserPresenceTimelineQuery, ApiResponse<UserPresenceTimelineDto>>
{
    public async Task<ApiResponse<UserPresenceTimelineDto>> Handle(GetUserPresenceTimelineQuery request, CancellationToken cancellationToken)
    {
        var result = new UserPresenceTimelineDto();

        // 1. Lấy trạng thái Online/Offline của toàn bộ người dùng
        var users = await context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Where(u => u.IsActive)
            .ToListAsync(cancellationToken);

        var onlineUsers = presenceService.GetAllOnlineUsersWithTabCount();

        foreach (var user in users)
        {
            var isOnline = onlineUsers.ContainsKey(user.Id);
            var tabCount = isOnline ? onlineUsers[user.Id] : 0;
            var roleName = user.UserRoles?.FirstOrDefault(ur => ur.Role != null)?.Role?.Name ?? "Nhân viên";
            
            var ext = (string?)null;
            var agentStatus = "Offline";
            var pauseReason = (string?)null;
            var deptName = "Chưa phân bộ phận";
            var deptId = 0;

            result.UserStatuses.Add(new UserPresenceStatusDto
            {
                UserId = user.Id,
                FullName = user.FullName ?? user.Username,
                Email = user.Email ?? "N/A",
                RoleName = roleName,
                Extension = ext,
                IsOnline = isOnline,
                CurrentTabCount = tabCount,
                DepartmentId = deptId,
                DepartmentName = deptName,
                AgentStatus = agentStatus,
                PauseReason = pauseReason
            });
        }

        // Sắp xếp online lên trước, sau đó theo tên
        result.UserStatuses = result.UserStatuses
            .OrderByDescending(x => x.IsOnline)
            .ThenBy(x => x.FullName)
            .ToList();

        // 2. Nếu có chọn User, lấy dòng thời gian online trong khoảng ngày
        if (request.SelectedUserId.HasValue)
        {
            var targetStartDate = request.StartDate ?? DateTime.Today;
            var targetEndDate = request.EndDate ?? DateTime.Today;

            var startOfRange = targetStartDate.Date;
            var endOfRange = targetEndDate.Date.AddDays(1).AddTicks(-1);

            var logs = await context.UserPresenceLogs
                .Where(x => x.UserId == request.SelectedUserId.Value && x.LoginTime >= startOfRange && x.LoginTime <= endOfRange)
                .OrderByDescending(x => x.LoginTime)
                .ToListAsync(cancellationToken);

            double totalSeconds = 0;
            var hourlyMax = Enumerable.Repeat(0, 24).ToList();

            foreach (var log in logs)
            {
                var logout = log.LogoutTime;
                var duration = 0;

                var actualLogoutTime = logout ?? (targetEndDate.Date == DateTime.Today.Date ? DateTime.Now : endOfRange);

                // Calculate hourly overlaps
                var current = log.LoginTime;
                while (current < actualLogoutTime)
                {
                    var h = current.Hour;
                    hourlyMax[h] = Math.Max(hourlyMax[h], log.TabCount);
                    
                    var nextHour = current.Date.AddHours(current.Hour + 1);
                    if (nextHour > actualLogoutTime) break;
                    current = nextHour;
                }
                var endHour = actualLogoutTime.Hour;
                hourlyMax[endHour] = Math.Max(hourlyMax[endHour], log.TabCount);

                if (logout.HasValue)
                {
                    duration = (int)(logout.Value - log.LoginTime).TotalSeconds;
                }
                else
                {
                    duration = (int)(DateTime.Now - log.LoginTime).TotalSeconds;
                }

                totalSeconds += duration;

                var currentTabs = 0;
                if (!logout.HasValue)
                {
                    currentTabs = presenceService.GetActiveTabCount(request.SelectedUserId.Value);
                }

                result.SelectedUserTimeline.Add(new UserPresenceLogDto
                {
                    Id = log.Id,
                    LoginTime = log.LoginTime,
                    LogoutTime = logout,
                    TabCount = log.TabCount,
                    CurrentTabCount = currentTabs,
                    DurationSeconds = duration
                });
            }

            result.HourlyMaxTabs = hourlyMax;
            result.TotalOnlineHoursToday = Math.Round(totalSeconds / 3600.0, 2);
        }

        return ApiResponse<UserPresenceTimelineDto>.Ok(result);
    }
}

