using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Exceptions;

namespace HR.Application.UserRoles;

public class GetRolesQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<GetRolesQuery, PagedResult<RoleListItemDto>>
{
    public async Task<PagedResult<RoleListItemDto>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        var scope = currentUserService.GetDataScope("user-role:view");
        var siteId = currentUserService.SiteId;

        var query = context.Roles.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.Name.Contains(request.Search) || (x.Description != null && x.Description.Contains(request.Search)));

        if (request.IsActive.HasValue)
            query = query.Where(x => x.IsActive == request.IsActive.Value);

        var total = await query.LongCountAsync(cancellationToken);
        var items = await query
            .Include(x => x.RoleLevel)
            .OrderBy(x => x.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new RoleListItemDto(
                x.Id,
                x.Name,
                x.Level,
                x.RoleLevel != null ? x.RoleLevel.Name : null,
                x.Description,
                scope == DataScope.SITE 
                    ? x.UserRoles.Count(ur => ur.User.SiteId == siteId)
                    : x.UserRoles.Count,
                x.RolePermissions.Count,
                x.IsActive,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<RoleListItemDto>
        {
            Items = items,
            Meta = new PagingMeta { Page = request.Page, PageSize = request.PageSize, Total = total }
        };
    }
}

public class GetRoleByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<GetRoleByIdQuery, RoleDetailDto?>
{
    public async Task<RoleDetailDto?> Handle(GetRoleByIdQuery request, CancellationToken cancellationToken)
    {
        var scope = currentUserService.GetDataScope("user-role:view");
        var siteId = currentUserService.SiteId;

        var role = await context.Roles
            .AsNoTracking()
            .Include(x => x.RoleLevel)
            .Include(x => x.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .Include(x => x.UserRoles)
                .ThenInclude(ur => ur.User)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (role == null) return null;

        var userCount = scope == DataScope.SITE
            ? role.UserRoles.Count(ur => ur.User.SiteId == siteId)
            : role.UserRoles.Count;

        return new RoleDetailDto(
            role.Id,
            role.Name,
            role.Level,
            role.RoleLevel?.Name,
            role.Description,
            role.IsActive,
            role.Name == "Super Admin", // BR-02
            userCount,
            role.CreatedAt,
            role.UpdatedAt,
            role.RolePermissions.Select(rp => new RolePermissionDto(
                rp.PermissionId,
                rp.Permission.Code,
                rp.DataScope)).ToList());
    }
}

public class GetPermissionTreeQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetPermissionTreeQuery, List<PermissionTreeNodeDto>>
{
    public async Task<List<PermissionTreeNodeDto>> Handle(GetPermissionTreeQuery request, CancellationToken cancellationToken)
    {
        var allMenus = await context.Menus
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);

        var allPermissions = await context.Permissions
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return BuildTree(allMenus, allPermissions, null);
    }

    private List<PermissionTreeNodeDto> BuildTree(List<Menu> menus, List<Permission> permissions, int? parentId)
    {
        var result = new List<PermissionTreeNodeDto>();

        // Add Menus
        var levelMenus = menus.Where(x => x.ParentId == parentId).ToList();
        foreach (var menu in levelMenus)
        {
            var node = new PermissionTreeNodeDto
            {
                Id = menu.Id,
                Code = menu.Code,
                Name = menu.Name,
                Level = parentId == null ? PermissionLevel.MENU : PermissionLevel.MODULE,
                Icon = menu.Icon,
                Children = BuildTree(menus, permissions, menu.Id)
            };

            // If this is a leaf menu node (or we just want to attach permissions to any menu), attach permissions
            var menuPermissions = permissions.Where(x => x.MenuId == menu.Id).ToList();
            if (menuPermissions.Any())
            {
                node.Children.AddRange(menuPermissions.Select(p => new PermissionTreeNodeDto
                {
                    Id = p.Id,
                    Code = p.Code,
                    Name = p.Name,
                    Level = PermissionLevel.ACTION,
                    Icon = null,
                    Children = []
                }));
            }

            result.Add(node);
        }

        return result;
    }
}

public class GetUserRolesQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<GetUserRolesQuery, List<int>>
{
    public async Task<List<int>> Handle(GetUserRolesQuery request, CancellationToken cancellationToken)
    {
        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy nhân viên.");

        var scope = currentUserService.GetDataScope("user-role:view");
        if (scope == DataScope.SITE && user.SiteId != currentUserService.SiteId)
        {
            throw new ForbiddenException("Bạn không có quyền xem vai trò của nhân viên thuộc site khác.");
        }

        return await context.UserRoles
            .Where(x => x.UserId == request.UserId)
            .Select(x => x.RoleId)
            .ToListAsync(cancellationToken);
    }
}

public class GetUserPermissionSummaryQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<GetUserPermissionSummaryQuery, List<UserPermissionSummaryDto>>
{
    public async Task<List<UserPermissionSummaryDto>> Handle(GetUserPermissionSummaryQuery request, CancellationToken cancellationToken)
    {
        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy nhân viên.");

        var scope = currentUserService.GetDataScope("user-role:view");
        if (scope == DataScope.SITE && user.SiteId != currentUserService.SiteId)
        {
            throw new ForbiddenException("Bạn không có quyền xem quyền của nhân viên thuộc site khác.");
        }

        var rolePermissions = await context.UserRoles
            .Where(ur => ur.UserId == request.UserId && ur.Role.IsActive)
            .SelectMany(ur => ur.Role.RolePermissions)
            .Include(rp => rp.Permission)
            .Include(rp => rp.Role)
            .ToListAsync(cancellationToken);

        return rolePermissions
            .GroupBy(rp => rp.Permission.Code)
            .Select(g => new UserPermissionSummaryDto
            {
                PermissionCode = g.Key,
                DataScope = g.Min(x => x.DataScope),
                GrantedByRoles = g.Select(x => x.Role.Name).Distinct().ToList()
            })
            .ToList();
    }
}

public class GetRoleChangeLogsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetRoleChangeLogsQuery, List<RoleChangeLogDto>>
{
    public async Task<List<RoleChangeLogDto>> Handle(GetRoleChangeLogsQuery request, CancellationToken cancellationToken)
    {
        // Hiện tại Role là global, nếu user thấy Role (user-role:view) thì thấy được Log.
        return await context.RoleChangeLogs
            .Where(x => x.RoleId == request.RoleId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new RoleChangeLogDto(
                x.Id,
                x.CreatedAt,
                x.Username,
                x.Action.ToString(),
                x.OldValue,
                x.NewValue,
                x.Reason))
            .ToListAsync(cancellationToken);
    }
}
public class GetRoleLevelsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetRoleLevelsQuery, List<RoleLevelDto>>
{
    public async Task<List<RoleLevelDto>> Handle(GetRoleLevelsQuery request, CancellationToken cancellationToken)
    {
        return await context.RoleLevels
            .AsNoTracking()
            .OrderBy(x => x.Level)
            .Select(x => new RoleLevelDto(x.Id, x.Level, x.Name))
            .ToListAsync(cancellationToken);
    }
}

