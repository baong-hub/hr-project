using HR.Application.Common.Models;
using MediatR;

namespace HR.Application.UserRoles;

public record GetRolesQuery(
    string? Search = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20) : IRequest<PagedResult<RoleListItemDto>>;

public record GetRoleByIdQuery(int Id) : IRequest<RoleDetailDto?>;

public record GetPermissionTreeQuery : IRequest<List<PermissionTreeNodeDto>>;

public record GetUserRolesQuery(int UserId) : IRequest<List<int>>;

public record GetUserPermissionSummaryQuery(int UserId) : IRequest<List<UserPermissionSummaryDto>>;

public record GetRoleChangeLogsQuery(int RoleId) : IRequest<List<RoleChangeLogDto>>;

public record GetRoleLevelsQuery : IRequest<List<RoleLevelDto>>;

