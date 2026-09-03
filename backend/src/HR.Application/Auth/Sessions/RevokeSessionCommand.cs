using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Auth.Sessions;

public record RevokeSessionCommand(string SessionId, int RevokedByUserId) : IRequest<ApiResponse<bool>>;

public class RevokeSessionCommandHandler(
    IApplicationDbContext context,
    ISessionValidationService sessionValidationService
) : IRequestHandler<RevokeSessionCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(RevokeSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await context.UserSessions
            .FirstOrDefaultAsync(x => x.SessionId == request.SessionId, cancellationToken);

        if (session == null)
        {
            return ApiResponse<bool>.Fail("SESSION_NOT_FOUND", "Không tìm thấy phiên đăng nhập");
        }

        session.IsRevoked = true;
        session.RevokedAt = DateTime.Now;
        session.RevokedBy = request.RevokedByUserId;
        session.UpdatedAt = DateTime.Now;

        await context.SaveChangesAsync(cancellationToken);

        // Invalidate cache
        sessionValidationService.InvalidateSessionCache(request.SessionId);

        return ApiResponse<bool>.Ok(true);
    }
}

