using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Auth.Sessions;

public record RevokeAllUserSessionsCommand(int TargetUserId, int RevokedByUserId, string? ExceptSessionId = null) : IRequest<ApiResponse<int>>;

public class RevokeAllUserSessionsCommandHandler(
    IApplicationDbContext context,
    ISessionValidationService sessionValidationService
) : IRequestHandler<RevokeAllUserSessionsCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(RevokeAllUserSessionsCommand request, CancellationToken cancellationToken)
    {
        var query = context.UserSessions
            .Where(x => x.UserId == request.TargetUserId && !x.IsRevoked);

        if (!string.IsNullOrEmpty(request.ExceptSessionId))
        {
            query = query.Where(x => x.SessionId != request.ExceptSessionId);
        }

        var sessionsToRevoke = await query.ToListAsync(cancellationToken);

        if (sessionsToRevoke.Count == 0)
        {
            return ApiResponse<int>.Ok(0);
        }

        var now = DateTime.Now;
        foreach (var s in sessionsToRevoke)
        {
            s.IsRevoked = true;
            s.RevokedAt = now;
            s.RevokedBy = request.RevokedByUserId;
            s.UpdatedAt = now;

            sessionValidationService.InvalidateSessionCache(s.SessionId);
        }

        await context.SaveChangesAsync(cancellationToken);

        return ApiResponse<int>.Ok(sessionsToRevoke.Count);
    }
}

