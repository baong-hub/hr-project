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
        if (string.IsNullOrWhiteSpace(request.GoogleToken))
        {
            throw new BadRequestException("GOOGLE_TOKEN_REQUIRED", "Google Token là bắt buộc để đăng nhập bằng Google.");
        }

        string email;
        string? verifiedFullName = null;
        string? verifiedAvatarUrl = null;

        // Xác thực chữ ký và tính hợp lệ của token trực tiếp với Google OAuth2 API
        try
        {
            using var httpClient = new System.Net.Http.HttpClient();
            var response = await httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(request.GoogleToken.Trim())}", cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new UnauthorizedException("INVALID_GOOGLE_TOKEN", "Google Token không hợp lệ hoặc đã hết hạn.");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = System.Text.Json.JsonDocument.Parse(content);
            var root = doc.RootElement;

            if (!root.TryGetProperty("email", out var emailProp) || string.IsNullOrWhiteSpace(emailProp.GetString()))
            {
                throw new UnauthorizedException("INVALID_GOOGLE_TOKEN", "Không tìm thấy thông tin email đã xác thực từ Google.");
            }

            if (root.TryGetProperty("email_verified", out var verifiedProp))
            {
                var isVerified = verifiedProp.ValueKind == System.Text.Json.JsonValueKind.True 
                    || (verifiedProp.ValueKind == System.Text.Json.JsonValueKind.String && verifiedProp.GetString()?.ToLower() == "true");
                if (!isVerified)
                {
                    throw new UnauthorizedException("UNVERIFIED_GOOGLE_EMAIL", "Email Google chưa được xác thực.");
                }
            }

            email = emailProp.GetString()!.Trim().ToLower();

            if (root.TryGetProperty("name", out var nameProp))
            {
                verifiedFullName = nameProp.GetString();
            }

            if (root.TryGetProperty("picture", out var picProp))
            {
                verifiedAvatarUrl = picProp.GetString();
            }
        }
        catch (UnauthorizedException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new UnauthorizedException("GOOGLE_AUTH_FAILED", $"Lỗi xác thực với Google: {ex.Message}");
        }

        var fullName = !string.IsNullOrWhiteSpace(verifiedFullName) ? verifiedFullName : request.FullName;
        var avatarUrl = !string.IsNullOrWhiteSpace(verifiedAvatarUrl) ? verifiedAvatarUrl : request.AvatarUrl;

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
                FullName = string.IsNullOrWhiteSpace(fullName) ? email.Split('@')[0] : fullName.Trim(),
                AvatarUrl = avatarUrl,
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
                AvatarUrl = avatarUrl
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
