using HR.Application.Common.Models;

namespace HR.Application.Users;

public record UserListItemDto(
    int Id,
    string Username,
    string? FullName,
    string? Email,
    string? Phone,
    string AccountType,
    int SiteId,
    string SiteName,
    bool IsActive,
    DateTime CreatedAt,
    List<string> Roles,
    List<int> RoleIds,
    string? SipUsername = null,
    string? PositionName = null,
    string? DepartmentName = null);

public record UserDetailDto(
    int Id,
    string Username,
    string? FullName,
    string? Email,
    string? Phone,
    string? Address,
    string AccountType,
    string? AvatarUrl,
    int SiteId,
    string SiteName,
    List<int> AccessibleSiteIds,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<int> RoleIds,
    string? SipUsername = null,
    string? SipPassword = null);

public record UserDirectPermissionDto(int PermissionId, string DataScope);


