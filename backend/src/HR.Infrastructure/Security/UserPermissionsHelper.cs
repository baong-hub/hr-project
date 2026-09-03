using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HR.Infrastructure.Security;

public static class UserPermissionsHelper
{
    /// <summary>
    /// Đồng bộ lại danh sách user_permissions của 1 user dựa trên tất cả Role permissions hiện tại của các Role mà user đó sở hữu.
    /// </summary>
    public static async Task SyncUserPermissionsAsync(ApplicationDbContext context, int userId, CancellationToken cancellationToken = default)
    {
        var userRoles = await context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == userId && ur.Role.IsActive)
            .Select(ur => ur.RoleId)
            .ToListAsync(cancellationToken);

        if (!userRoles.Any()) return;

        var rolePermissions = await context.RolePermissions
            .AsNoTracking()
            .Where(rp => userRoles.Contains(rp.RoleId))
            .ToListAsync(cancellationToken);

        var existingUserPerms = await context.UserPermissions
            .Where(up => up.UserId == userId)
            .ToListAsync(cancellationToken);

        // Chỉ xóa những quyền kế thừa từ Role (IsCustom == false)
        var permsToRemove = existingUserPerms.Where(up => !up.IsCustom).ToList();
        var customPerms = existingUserPerms.Where(up => up.IsCustom).ToList();
        var customKeys = new HashSet<(int PermissionId, DataScope Scope)>(customPerms.Select(cp => (cp.PermissionId, cp.DataScope)));

        context.UserPermissions.RemoveRange(permsToRemove);

        var permissionsToAssign = rolePermissions
            .GroupBy(rp => rp.PermissionId)
            .Select(g => new UserPermission
            {
                UserId = userId,
                PermissionId = g.Key,
                DataScope = g.Min(rp => rp.DataScope),
                IsCustom = false
            })
            .Where(up => !customKeys.Contains((up.PermissionId, up.DataScope)))
            .ToList();

        foreach (var up in permissionsToAssign)
        {
            context.UserPermissions.Add(up);
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Đồng bộ lại user_permissions cho toàn bộ User gán vai trò RoleId.
    /// </summary>
    public static async Task SyncRoleUsersPermissionsAsync(ApplicationDbContext context, int roleId, CancellationToken cancellationToken = default)
    {
        var userIds = await context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == roleId)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var userId in userIds)
        {
            await SyncUserPermissionsAsync(context, userId, cancellationToken);
        }
    }

    /// <summary>
    /// Đồng bộ lại danh sách user_permissions cho TẤT CẢ user trong hệ thống bằng 2 câu SaveChanges tối ưu.
    /// </summary>
    public static async Task SyncAllUsersPermissionsAsync(ApplicationDbContext context, CancellationToken cancellationToken = default)
    {
        // 1. Xóa toàn bộ user_permissions được kế thừa từ vai trò (IsCustom == false) của mọi User
        var permsToRemove = await context.UserPermissions
            .Where(up => !up.IsCustom)
            .ToListAsync(cancellationToken);
            
        if (permsToRemove.Any())
        {
            context.UserPermissions.RemoveRange(permsToRemove);
            await context.SaveChangesAsync(cancellationToken);
        }

        // 2. Lấy danh sách vai trò đang kích hoạt của các User
        var activeUserRoles = await context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.Role.IsActive && ur.UserId > 0)
            .ToListAsync(cancellationToken);

        if (!activeUserRoles.Any()) return;

        // 3. Lấy tất cả phân quyền của các vai trò
        var rolePermissions = await context.RolePermissions
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var rolePermsByRole = rolePermissions.ToLookup(rp => rp.RoleId);
        
        // 4. Lấy danh sách các quyền Custom hiện có của từng user để tránh trùng lặp
        var customUserPerms = await context.UserPermissions
            .AsNoTracking()
            .Where(up => up.IsCustom)
            .ToListAsync(cancellationToken);
            
        var customKeys = new HashSet<(int UserId, int PermissionId, DataScope Scope)>(
            customUserPerms.Select(cp => (cp.UserId, cp.PermissionId, cp.DataScope))
        );

        var userPermissionsToAssign = new List<UserPermission>();
        var userRolesGrouped = activeUserRoles.GroupBy(ur => ur.UserId);

        foreach (var userGroup in userRolesGrouped)
        {
            var userId = userGroup.Key;
            var roleIds = userGroup.Select(ur => ur.RoleId).ToList();
            
            var userRolePerms = roleIds.SelectMany(roleId => rolePermsByRole[roleId]).ToList();
            
            var userPerms = userRolePerms
                .GroupBy(rp => rp.PermissionId)
                .Select(g => new UserPermission
                {
                    UserId = userId,
                    PermissionId = g.Key,
                    DataScope = g.Min(rp => rp.DataScope),
                    IsCustom = false
                })
                .Where(up => !customKeys.Contains((up.UserId, up.PermissionId, up.DataScope)))
                .ToList();
                
            userPermissionsToAssign.AddRange(userPerms);
        }

        if (userPermissionsToAssign.Any())
        {
            context.UserPermissions.AddRange(userPermissionsToAssign);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

