using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;

namespace HR.Application.Auth.Queries.GetAuthorizedMenus;

public class GetAuthorizedMenusQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<GetAuthorizedMenusQuery, IEnumerable<MenuDto>>
{
    public async Task<IEnumerable<MenuDto>> Handle(GetAuthorizedMenusQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        if (userId == 0) return [];

        // 1. Lấy danh sách PermissionId mà user có từ UserPermissions
        var userPermissionIds = await context.UserPermissions
            .Where(up => up.UserId == userId)
            .Select(up => up.PermissionId)
            .Distinct()
            .ToListAsync(cancellationToken);

        // 2. Lấy toàn bộ Menu cùng với Permissions của nó
        var allMenus = await context.Menus
            .AsNoTracking()
            .Include(m => m.Permissions)
            .OrderBy(m => m.SortOrder)
            .ToListAsync(cancellationToken);

        // 3. Kiểm tra xem user có phải Super Admin không
        var roles = await context.UserRoles
            .Where(ur => ur.UserId == userId && ur.Role.IsActive)
            .Select(ur => ur.Role.Name)
            .ToListAsync(cancellationToken);

        if (!roles.Any())
        {
            var userObj = await context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (userObj != null && userObj.Role.IsActive)
            {
                roles.Add(userObj.Role.Name);
            }
        }
        
        bool isSuperAdmin = roles.Contains("Super Admin") || roles.Contains("super_admin") || userId == 1;

        if (!userPermissionIds.Any() && !isSuperAdmin)
        {
            var userRolesList = await context.UserRoles
                .Where(ur => ur.UserId == userId && ur.Role.IsActive)
                .Select(ur => ur.RoleId)
                .ToListAsync(cancellationToken);
                
            if (!userRolesList.Any())
            {
                var userObj = await context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                if (userObj != null)
                {
                    userRolesList.Add(userObj.RoleId);
                }
            }

            userPermissionIds = await context.RolePermissions
                .Where(rp => userRolesList.Contains(rp.RoleId))
                .Select(rp => rp.PermissionId)
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        // 4. Lọc Menu
        var menuDict = allMenus.ToDictionary(m => m.Id);
        var authorizedMenuIds = new HashSet<int>();

        if (isSuperAdmin)
        {
            foreach (var id in menuDict.Keys) authorizedMenuIds.Add(id);
        }
        else
        {
            foreach (var menu in allMenus)
            {
                if (menu.Permissions.Any(p => userPermissionIds.Contains(p.Id)))
                {
                    var current = menu;
                    while (current != null)
                    {
                        if (!authorizedMenuIds.Add(current.Id)) break;
                        current = current.ParentId.HasValue ? menuDict.GetValueOrDefault(current.ParentId.Value) : null;
                    }
                }
            }
        }

        // 5. Xây dựng cây MenuDto
        return allMenus
            .Where(m => m.ParentId == null && authorizedMenuIds.Contains(m.Id))
            .Select(m => MapToDto(m, allMenus, authorizedMenuIds))
            .ToList();
    }

    private MenuDto MapToDto(HR.Domain.Entities.Menu menu, List<HR.Domain.Entities.Menu> allMenus, HashSet<int> authorizedIds)
    {
        var children = allMenus
            .Where(m => m.ParentId == menu.Id && authorizedIds.Contains(m.Id))
            .Select(m => MapToDto(m, allMenus, authorizedIds))
            .ToList();

        return new MenuDto(
            menu.Id,
            menu.Code,
            menu.Name,
            menu.ShortName,
            menu.Icon,
            menu.Route,
            menu.SortOrder,
            children
        );
    }
}
