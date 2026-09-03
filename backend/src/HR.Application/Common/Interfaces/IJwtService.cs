namespace HR.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(int userId, string username, int siteId, IEnumerable<int> allowedSiteIds, int minRoleLevel, IEnumerable<string> roles, IEnumerable<string> permissions, int? staffId = null, string? sessionId = null, string? accountType = null);
}

