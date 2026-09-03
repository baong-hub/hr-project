using HR.Domain.Enums;

namespace HR.Application.Common.Interfaces;

public interface ICurrentUserService
{
    int UserId { get; }
    string? Username { get; }
    string? SessionId { get; }
    int SiteId { get; }
    int? StaffId { get; }
    IEnumerable<int> AllowedSites { get; }
    int MinRoleLevel { get; }
    bool IsSuperAdmin { get; }
    bool HasPermission(string code);
    DataScope GetDataScope(string permissionCode);
}

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
    DateTime Now { get; }
}
