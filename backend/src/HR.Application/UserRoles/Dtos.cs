using HR.Application.Common.Models;
using HR.Domain.Enums;

namespace HR.Application.UserRoles;

public record RoleListItemDto(
    int Id,
    string Name,
    int Level,
    string? LevelName,
    string? Description,
    int UserCount,
    int PermissionCount,
    bool IsActive,
    DateTime CreatedAt);

public record RoleDetailDto(
    int Id,
    string Name,
    int Level,
    string? LevelName,
    string? Description,
    bool IsActive,
    bool IsSystem,
    int UserCount,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<RolePermissionDto> Permissions);

public record RolePermissionDto(
    int PermissionId,
    string PermissionCode,
    DataScope DataScope);

public record PermissionTreeNodeDto
{
    public int Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public PermissionLevel Level { get; init; }
    public string? Icon { get; init; }
    public List<PermissionTreeNodeDto> Children { get; init; } = [];
}

public record UserRoleListItemDto(
    int Id,
    string Username,
    string? FullName,
    int SiteId,
    string SiteName,
    List<string> Roles);

public record RoleChangeLogDto(
    int Id,
    DateTime CreatedAt,
    string Username,
    string Action,
    string? OldValue,
    string? NewValue,
    string? Reason);

public record UserPermissionSummaryDto
{
    public string PermissionCode { get; init; } = string.Empty;
    public DataScope DataScope { get; init; }
    public List<string> GrantedByRoles { get; init; } = [];
}

public record RoleLevelDto(int Id, int Level, string Name);

