using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.Auth.Dtos;

namespace HR.Application.Auth.Commands.RefreshToken;

public class RefreshTokenHandler : IRequestHandler<RefreshTokenCommand, LoginResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;

    public RefreshTokenHandler(IApplicationDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<LoginResultDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenRecord = await _context.RefreshTokens
            .Include(rt => rt.User)
            .ThenInclude(u => u.Role)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken);

        if (tokenRecord == null || tokenRecord.IsRevoked || tokenRecord.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedException("AUTH_INVALID_REFRESH_TOKEN", "Refresh Token không hợp lệ hoặc đã hết hạn");
        }

        if (tokenRecord.User.Status == UserStatus.BLOCKED)
        {
            throw new ForbiddenException("AUTH_ACCOUNT_BLOCKED", "Tài khoản đã bị khóa bởi quản trị viên");
        }

        // Revoke the old refresh token
        tokenRecord.IsRevoked = true;

        // Generate a new refresh token
        var newRefreshTokenValue = Guid.NewGuid().ToString("N");
        var newRefreshToken = new HR.Domain.Entities.RefreshToken
        {
            UserId = tokenRecord.UserId,
            Token = newRefreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };

        _context.RefreshTokens.Add(newRefreshToken);

        // Get Permissions
        var permissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == tokenRecord.User.RoleId)
            .Select(rp => rp.Permission.Code)
            .ToListAsync(cancellationToken);

        // Generate a new access token
        var accessToken = _jwtService.GenerateToken(
            userId: tokenRecord.User.Id,
            username: tokenRecord.User.Email,
            siteId: 0,
            allowedSiteIds: Array.Empty<int>(),
            minRoleLevel: 0,
            roles: new[] { tokenRecord.User.Role.Name },
            permissions: permissions,
            staffId: null,
            sessionId: null,
            accountType: null
        );

        await _context.SaveChangesAsync(cancellationToken);

        return new LoginResultDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshTokenValue,
            User = new UserInfoDto
            {
                Id = tokenRecord.User.Id,
                Email = tokenRecord.User.Email,
                Role = tokenRecord.User.Role.Name,
                Permissions = permissions
            }
        };
    }
}
