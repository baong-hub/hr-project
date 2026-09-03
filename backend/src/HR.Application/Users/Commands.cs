using HR.Domain.Enums;
using HR.Application.UserRoles;
using MediatR;

namespace HR.Application.Users;


public record CreateUserCommand(
    string Username,
    string Password,
    string? FullName,
    string? Email,
    string? Phone,
    string? Address,
    AccountType AccountType,
    int SiteId,
    List<int> AccessibleSiteIds,
    List<int>? RoleIds = null,
    string? SipUsername = null,
    string? SipPassword = null) : IRequest<int>;

public record UpdateUserCommand(
    int Id,
    string? FullName,
    string? Email,
    string? Phone,
    string? Address,
    AccountType AccountType,
    int SiteId,
    List<int> AccessibleSiteIds,
    bool IsActive,
    List<int>? RoleIds = null,
    string? SipUsername = null,
    string? SipPassword = null) : IRequest;

public record DeleteUserCommand(int Id) : IRequest;

public record ResetPasswordCommand(int Id, string NewPassword) : IRequest;

public record UploadUserAvatarCommand(
    int UserId,
    Stream FileStream,
    string FileName) : IRequest<string>;

public record AssignUserDirectPermissionsCommand(
    int UserId,
    List<PermissionAssignmentDto> Permissions) : IRequest;


