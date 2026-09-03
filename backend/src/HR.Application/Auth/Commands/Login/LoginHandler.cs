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

namespace HR.Application.Auth.Commands.Login;

public class LoginHandler : IRequestHandler<LoginCommand, LoginResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public LoginHandler(IApplicationDbContext context, IPasswordHasher passwordHasher, IJwtService jwtService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<LoginResultDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new BadRequestException("AUTH_INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác");
        }

        if (user.Status == UserStatus.BLOCKED)
        {
            throw new ForbiddenException("AUTH_ACCOUNT_BLOCKED", "Tài khoản đã bị khóa bởi quản trị viên");
        }

        // Generate Refresh Token
        var refreshTokenValue = Guid.NewGuid().ToString("N");
        var refreshToken = new HR.Domain.Entities.RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };

        _context.RefreshTokens.Add(refreshToken);

        // Get Permissions
        var permissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == user.RoleId)
            .Select(rp => rp.Permission.Code)
            .ToListAsync(cancellationToken);

        // Generate Access Token
        var accessToken = _jwtService.GenerateToken(
            userId: user.Id,
            username: user.Email,
            siteId: 0,
            allowedSiteIds: Array.Empty<int>(),
            minRoleLevel: 0,
            roles: new[] { user.Role.Name },
            permissions: permissions,
            staffId: null,
            sessionId: null,
            accountType: null
        );

        await _context.SaveChangesAsync(cancellationToken);

        return new LoginResultDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role.Name,
                Permissions = permissions
            }
        };
    }
}
