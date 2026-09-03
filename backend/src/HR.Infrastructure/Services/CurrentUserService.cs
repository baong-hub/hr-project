using System.Security.Claims;
using HR.Application.Common.Interfaces;
using HR.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HR.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public int UserId 
    {
        get
        {
            var id = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(id, out var userId) ? userId : 0;
        }
    }

    public string? Username => httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

    public string? SessionId => httpContextAccessor.HttpContext?.User?.FindFirst("sid")?.Value
        ?? httpContextAccessor.HttpContext?.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;

    public int SiteId
    {
        get
        {
            // 1. Ưu tiên lấy từ Header "X-Site-Id"
            var headerValue = httpContextAccessor.HttpContext?.Request.Headers["X-Site-Id"].ToString();
            if (int.TryParse(headerValue, out var siteIdFromHeader))
            {
                // Nếu header có giá trị (kể cả 0), trả về giá trị đó
                return siteIdFromHeader;
            }

            // 2. Fallback về SiteId chính trong JWT Claim
            var siteIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst("siteId")?.Value;
            return int.TryParse(siteIdClaim, out var siteId) ? siteId : 0;
        }
    }

    public IEnumerable<int> AllowedSites
    {
        get
        {
            var allowedSitesClaim = httpContextAccessor.HttpContext?.User?.FindFirst("allowedSites")?.Value;
            if (string.IsNullOrEmpty(allowedSitesClaim)) return Enumerable.Empty<int>();

            return allowedSitesClaim.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s, out var id) ? id : 0)
                .Where(id => id > 0)
                .ToList();
        }
    }

    public int MinRoleLevel
    {
        get
        {
            var levelClaim = httpContextAccessor.HttpContext?.User?.FindFirst("minRoleLevel")?.Value;
            return int.TryParse(levelClaim, out var level) ? level : 5; // Mặc định là Nhân viên (5)
        }
    }

    public int? StaffId
    {
        get
        {
            var staffIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst("staffId")?.Value;
            return int.TryParse(staffIdClaim, out var id) ? id : null;
        }
    }

    public bool IsSuperAdmin => MinRoleLevel == 0;

    public bool IsAdmin
    {
        get
        {
            if (IsSuperAdmin) return true;

            var user = httpContextAccessor.HttpContext?.User;
            if (user != null)
            {
                if (user.IsInRole("Super Admin") || user.IsInRole("Admin")) return true;

                var accountType = user.FindFirst("accountType")?.Value;
                if (string.Equals(accountType, "Admin", StringComparison.OrdinalIgnoreCase)) return true;
            }

            try
            {
                var dbContext = httpContextAccessor.HttpContext?.RequestServices.GetService<IApplicationDbContext>();
                if (dbContext != null && UserId > 0)
                {
                    var isDbAdmin = dbContext.Users
                        .AsNoTracking()
                        .Any(u => u.Id == UserId && (u.AccountType == AccountType.Admin || u.UserRoles.Any(ur => ur.Role.Name == "Super Admin" || ur.Role.Name == "Admin" || ur.Role.Level == 0)));
                    if (isDbAdmin) return true;
                }
            }
            catch { }

            return false;
        }
    }

    public bool HasPermission(string code)
    {
        if (IsAdmin) return true;

        try
        {
            var dbContext = httpContextAccessor.HttpContext?.RequestServices.GetService<IApplicationDbContext>();
            if (dbContext != null && UserId > 0)
            {
                var hasInDb = dbContext.UserPermissions
                    .AsNoTracking()
                    .Any(up => up.UserId == UserId && up.Permission.Code == code);
                if (hasInDb) return true;
            }
        }
        catch { }

        var permissions = httpContextAccessor.HttpContext?.User?.FindAll("permission").Select(c => c.Value) ?? Enumerable.Empty<string>();
        return permissions.Any(p => p == code || p.StartsWith(code + "#"));
    }

    public DataScope GetDataScope(string permissionCode)
    {
        if (IsAdmin) return DataScope.ALL;

        try
        {
            var dbContext = httpContextAccessor.HttpContext?.RequestServices.GetService<IApplicationDbContext>();
            if (dbContext != null && UserId > 0)
            {
                var userPermScope = dbContext.UserPermissions
                    .AsNoTracking()
                    .Where(up => up.UserId == UserId && up.Permission.Code == permissionCode)
                    .Select(up => (DataScope?)up.DataScope)
                    .FirstOrDefault();

                if (userPermScope.HasValue)
                {
                    return userPermScope.Value;
                }
            }
        }
        catch { }

        var permissions = httpContextAccessor.HttpContext?.User?.FindAll("permission").Select(c => c.Value) ?? Enumerable.Empty<string>();
        var claim = permissions.FirstOrDefault(p => p.StartsWith(permissionCode + "#"));
        if (claim != null)
        {
            var parts = claim.Split('#');
            if (parts.Length > 1 && Enum.TryParse<DataScope>(parts[1], out var scope))
            {
                return scope;
            }
        }
        return DataScope.OWN; // Default
    }
}

