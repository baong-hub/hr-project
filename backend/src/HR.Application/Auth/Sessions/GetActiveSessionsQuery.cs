using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Auth.Sessions;

public record GetActiveSessionsQuery(
    string? Search = null,
    int? UserId = null,
    string? CurrentSessionId = null
) : IRequest<ApiResponse<List<UserSessionDto>>>;

public class GetActiveSessionsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetActiveSessionsQuery, ApiResponse<List<UserSessionDto>>>
{
    public async Task<ApiResponse<List<UserSessionDto>>> Handle(GetActiveSessionsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.Now;

        var expired = await context.UserSessions
            .Where(x => !x.IsRevoked && x.ExpiresAt <= now)
            .ToListAsync(cancellationToken);
        if (expired.Any())
        {
            foreach (var s in expired)
            {
                s.IsRevoked = true;
                s.RevokedAt = now;
                s.UpdatedAt = now;
            }
            await context.SaveChangesAsync(cancellationToken);
        }

        var query = context.UserSessions
            .Include(x => x.User)
            .AsNoTracking()
            .Where(x => !x.IsRevoked && x.ExpiresAt > now);

        if (request.UserId.HasValue && request.UserId.Value > 0)
        {
            query = query.Where(x => x.UserId == request.UserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(x =>
                (x.User != null && (EF.Functions.Like(x.User.Username, $"%{s}%") || (x.User.FullName != null && EF.Functions.Like(x.User.FullName, $"%{s}%")))) ||
                (x.IpAddress != null && EF.Functions.Like(x.IpAddress, $"%{s}%")) ||
                (x.DeviceName != null && EF.Functions.Like(x.DeviceName, $"%{s}%")) ||
                (x.Browser != null && EF.Functions.Like(x.Browser, $"%{s}%")));
        }

        var sessions = await query
            .OrderByDescending(x => x.LastActiveAt)
            .Select(x => new UserSessionDto
            {
                Id = x.Id,
                SessionId = x.SessionId,
                UserId = x.UserId,
                Username = x.User != null ? x.User.Username : string.Empty,
                FullName = x.User != null ? (x.User.FullName ?? x.User.Username) : string.Empty,
                DeviceName = x.DeviceName ?? "Thiết bị lạ",
                Browser = x.Browser ?? "Trình duyệt không xác định",
                IpAddress = x.IpAddress ?? "0.0.0.0",
                LoginTime = x.CreatedAt,
                LastActiveAt = x.LastActiveAt,
                ExpiresAt = x.ExpiresAt,
                IsRevoked = x.IsRevoked,
                IsCurrentSession = !string.IsNullOrEmpty(request.CurrentSessionId) && x.SessionId == request.CurrentSessionId
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<UserSessionDto>>.Ok(sessions);
    }
}

