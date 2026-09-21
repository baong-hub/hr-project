using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Auth.Dtos;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Auth.Commands.GoogleLogin;

public record GoogleLoginCommand(
    string? Email,
    string? GoogleToken,
    string? FullName,
    string? AvatarUrl) : IRequest<LoginResultDto>;

public class GoogleLoginCommandHandler(
    IApplicationDbContext context,
    IJwtService jwtService,
    IPasswordHasher passwordHasher) : IRequestHandler<GoogleLoginCommand, LoginResultDto>
{
    public async Task<LoginResultDto> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email?.Trim().ToLower();

        // Nếu client truyền googleToken nhưng không có email trực tiếp, ta có thể giải mã payload jwt Google
        if (string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(request.GoogleToken))
        {
            try
            {
                var parts = request.GoogleToken.Split('.');
                if (parts.Length >= 2)
                {
                    var payload = parts[1];
                    // Pad base64
                    switch (payload.Length % 4)
                    {
                        case 2: payload += "=="; break;
                        case 3: payload += "="; break;
                    }
                    var bytes = Convert.FromBase64String(payload);
                    var json = System.Text.Encoding.UTF8.GetString(bytes);
                    using var doc = System.Text.Json.JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("email", out var emailProp))
                    {
                        email = emailProp.GetString()?.Trim().ToLower();
                    }
                }
            }
            catch
            {
                // Fallback nếu token không phải dạng JWT
            }
        }

        if (string.IsNullOrEmpty(email))
        {
            throw new BadRequestException("INVALID_GOOGLE_TOKEN", "Không thể xác thực thông tin tài khoản Google.");
        }

        var user = await context.Users
            .Include(u => u.Role)
            .Include(u => u.Candidate)
            .Include(u => u.Employer)
                .ThenInclude(e => e!.Company)
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null, cancellationToken);

        if (user == null)
        {
            // Tự động khởi tạo tài khoản Ứng viên mới qua Google
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == "CANDIDATE" || r.Name == "Ứng viên", cancellationToken)
                       ?? await context.Roles.FirstOrDefaultAsync(cancellationToken);

            if (role == null)
            {
                throw new NotFoundException("ROLE_NOT_FOUND", "Không tìm thấy vai trò Ứng viên trong hệ thống.");
            }

            var site = await context.Sites.FirstOrDefaultAsync(cancellationToken);
            var siteId = site?.Id ?? 1;

            user = new User
            {
                Username = email,
                Email = email,
                PasswordHash = passwordHasher.Hash(Guid.NewGuid().ToString("N")),
                PhoneNumber = "0000000000",
                FullName = string.IsNullOrWhiteSpace(request.FullName) ? email.Split('@')[0] : request.FullName.Trim(),
                AvatarUrl = request.AvatarUrl,
                RoleId = role.Id,
                SiteId = siteId,
                AccountType = AccountType.User,
                IsEmailVerified = true,
                Status = UserStatus.ACTIVE
            };

            context.Users.Add(user);
            await context.SaveChangesAsync(cancellationToken);

            var candidate = new Candidate
            {
                Id = user.Id,
                FullName = user.FullName,
                AvatarUrl = request.AvatarUrl
            };
            context.Candidates.Add(candidate);
            context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });

            var rolePerms = await context.RolePermissions
                .Where(rp => rp.RoleId == role.Id)
                .ToListAsync(cancellationToken);

            foreach (var rp in rolePerms)
            {
                context.UserPermissions.Add(new UserPermission
                {
                    UserId = user.Id,
                    PermissionId = rp.PermissionId,
                    DataScope = rp.DataScope,
                    IsCustom = false
                });
            }

            await context.SaveChangesAsync(cancellationToken);
            user.Role = role;
            user.Candidate = candidate;
        }
        else
        {
            if (user.Status == UserStatus.BLOCKED)
            {
                throw new ForbiddenException("AUTH_ACCOUNT_BLOCKED", "Tài khoản đã bị khóa bởi quản trị viên.");
            }

            if (!user.IsEmailVerified)
            {
                user.IsEmailVerified = true;
            }

            if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(request.AvatarUrl))
            {
                user.AvatarUrl = request.AvatarUrl;
            }
        }

        // Tạo Refresh Token
        var refreshTokenValue = Guid.NewGuid().ToString("N");
        var refreshToken = new HR.Domain.Entities.RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        context.RefreshTokens.Add(refreshToken);

        // Lấy danh sách Permissions
        var permissions = await context.RolePermissions
            .Where(rp => rp.RoleId == user.RoleId)
            .Select(rp => rp.Permission.Code)
            .ToListAsync(cancellationToken);

        // Sinh JWT Access Token
        var accessToken = jwtService.GenerateToken(
            userId: user.Id,
            username: user.Email,
            siteId: user.SiteId,
            allowedSiteIds: Array.Empty<int>(),
            minRoleLevel: 0,
            roles: new[] { user.Role.Name },
            permissions: permissions,
            staffId: null,
            sessionId: null,
            accountType: user.AccountType.ToString()
        );

        await context.SaveChangesAsync(cancellationToken);

        return new LoginResultDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role.Name,
                FullName = user.FullName ?? user.Username,
                AvatarUrl = user.AvatarUrl,
                CompanyName = user.Employer?.Company?.Name,
                CompanyLogoUrl = user.Employer?.Company?.LogoUrl,
                Permissions = permissions
            }
        };
    }
}
