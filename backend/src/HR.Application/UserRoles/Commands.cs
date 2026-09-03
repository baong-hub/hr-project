using HR.Domain.Enums;
using MediatR;

namespace HR.Application.UserRoles;

public record CreateRoleCommand(
    string Name,
    int Level,
    string? Description) : IRequest<int>;

public record UpdateRoleCommand(
    int Id,
    string Name,
    int Level,
    string? Description,
    bool IsActive) : IRequest;

public record DeleteRoleCommand(int Id) : IRequest;

public record AssignRolePermissionsCommand(
    int RoleId,
    List<PermissionAssignmentDto> Permissions) : IRequest;

public record PermissionAssignmentDto(int PermissionId, DataScope DataScope);

public record CloneRoleCommand(
    int SourceRoleId,
    string NewName) : IRequest<int>;

public record AssignUserRolesCommand(
    int UserId,
    List<int> RoleIds) : IRequest;

public record AssignUsersToRoleCommand(
    int RoleId,
    List<int> UserIds) : IRequest;

