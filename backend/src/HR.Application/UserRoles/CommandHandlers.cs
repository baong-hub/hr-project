using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.UserRoles;

public class CreateRoleCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<CreateRoleCommand, int>
{
    public async Task<int> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        if (await context.Roles.AnyAsync(r => r.Name == request.Name, cancellationToken))
            throw new ConflictException("ROLE_NAME_DUPLICATE", "Tên vai trò đã tồn tại.");

        // Validation: Cấp của role mới phải >= cấp của người tạo
        if (request.Level < currentUserService.MinRoleLevel)
            throw new ForbiddenException("ROLE_LEVEL_INVALID", $"Bạn không thể tạo vai trò có cấp ({request.Level}) cao hơn cấp của bạn ({currentUserService.MinRoleLevel}).");

        var role = new Role
        {
            Name = request.Name,
            Level = request.Level,
            Description = request.Description,
            IsActive = true
        };

        context.Roles.Add(role);
        await context.SaveChangesAsync(cancellationToken);

        context.RoleChangeLogs.Add(new RoleChangeLog
        {
            RoleId = role.Id,
            UserId = currentUserService.UserId,
            Username = currentUserService.Username ?? "system",
            Action = RoleChangeAction.ROLE_CREATED,
            NewValue = role.Name
        });
        await context.SaveChangesAsync(cancellationToken);

        return role.Id;
    }
}

public class UpdateRoleCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<UpdateRoleCommand>
{
    public async Task Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("ROLE_NOT_FOUND", "Không tìm thấy vai trò.");

        if (role.Name == "Super Admin")
            throw new ForbiddenException("ROLE_SYSTEM_PROTECTED", "Không thể sửa vai trò hệ thống.");

        // Validation: Không thể sửa role có cấp cao hơn cấp của mình
        if (role.Level < currentUserService.MinRoleLevel)
            throw new ForbiddenException("ROLE_LEVEL_INVALID", "Bạn không có quyền sửa vai trò có cấp cao hơn cấp của bạn.");

        // Validation: Cấp mới của role phải >= cấp của mình
        if (request.Level < currentUserService.MinRoleLevel)
            throw new ForbiddenException("ROLE_LEVEL_INVALID", $"Bạn không thể đặt cấp vai trò ({request.Level}) cao hơn cấp của bạn ({currentUserService.MinRoleLevel}).");

        if (await context.Roles.AnyAsync(r => r.Name == request.Name && r.Id != request.Id, cancellationToken))
            throw new ConflictException("ROLE_NAME_DUPLICATE", "Tên vai trò đã tồn tại.");

        var oldName = role.Name;
        var oldActive = role.IsActive;
        var oldLevel = role.Level;

        role.Name = request.Name;
        role.Level = request.Level;
        role.Description = request.Description;
        role.IsActive = request.IsActive;

        await context.SaveChangesAsync(cancellationToken);

        if (oldName != role.Name)
            context.RoleChangeLogs.Add(new RoleChangeLog { RoleId = role.Id, UserId = currentUserService.UserId, Username = currentUserService.Username ?? "system", Action = RoleChangeAction.ROLE_UPDATED, OldValue = oldName, NewValue = role.Name });

        if (oldActive != role.IsActive)
            context.RoleChangeLogs.Add(new RoleChangeLog { RoleId = role.Id, UserId = currentUserService.UserId, Username = currentUserService.Username ?? "system", Action = role.IsActive ? RoleChangeAction.ROLE_ACTIVATED : RoleChangeAction.ROLE_DEACTIVATED });

        await context.SaveChangesAsync(cancellationToken);
    }
}

public class DeleteRoleCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<DeleteRoleCommand>
{
    public async Task Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await context.Roles
            .Include(r => r.UserRoles)
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("ROLE_NOT_FOUND", "Không tìm thấy vai trò.");

        if (role.Name == "Super Admin")
            throw new ForbiddenException("ROLE_SYSTEM_PROTECTED");

        if (role.UserRoles.Any())
            throw new ConflictException("ROLE_HAS_USERS", $"Vai trò đang có {role.UserRoles.Count} nhân viên. Không thể xóa.");

        role.IsActive = false; // Soft delete
        
        context.RoleChangeLogs.Add(new RoleChangeLog
        {
            RoleId = role.Id,
            UserId = currentUserService.UserId,
            Username = currentUserService.Username ?? "system",
            Action = RoleChangeAction.ROLE_DELETED
        });

        await context.SaveChangesAsync(cancellationToken);
    }
}

public class AssignRolePermissionsCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<AssignRolePermissionsCommand>
{
    public async Task Handle(AssignRolePermissionsCommand request, CancellationToken cancellationToken)
    {
        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken)
            ?? throw new NotFoundException("ROLE_NOT_FOUND", "Không tìm thấy vai trò.");

        if (role.Name == "Super Admin")
            throw new ForbiddenException("ROLE_SYSTEM_PROTECTED");

        // Transactional replace
        var existing = await context.RolePermissions
            .Where(x => x.RoleId == request.RoleId)
            .ToListAsync(cancellationToken);

        context.RolePermissions.RemoveRange(existing);

        foreach (var p in request.Permissions)
        {
            context.RolePermissions.Add(new RolePermission
            {
                RoleId = request.RoleId,
                PermissionId = p.PermissionId,
                DataScope = p.DataScope
            });
        }

        context.RoleChangeLogs.Add(new RoleChangeLog
        {
            RoleId = role.Id,
            UserId = currentUserService.UserId,
            Username = currentUserService.Username ?? "system",
            Action = RoleChangeAction.PERMISSION_ASSIGNED,
            Reason = $"Updated {request.Permissions.Count} permissions"
        });

        // Tự động re-sync user_permissions cho tất cả các user sở hữu role này
        var affectedUserIds = await context.UserRoles
            .Where(ur => ur.RoleId == request.RoleId)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var userId in affectedUserIds)
        {
            var userRoleIds = await context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RoleId)
                .ToListAsync(cancellationToken);

            var userRolePerms = await context.RolePermissions
                .Where(rp => userRoleIds.Contains(rp.RoleId))
                .ToListAsync(cancellationToken);

            var existingUserPerms = await context.UserPermissions
                .Where(up => up.UserId == userId)
                .ToListAsync(cancellationToken);

            context.UserPermissions.RemoveRange(existingUserPerms);

            var permissionsToAssign = userRolePerms
                .GroupBy(rp => rp.PermissionId)
                .Select(g => new UserPermission
                {
                    UserId = userId,
                    PermissionId = g.Key,
                    DataScope = g.Min(rp => rp.DataScope)
                });

            foreach (var up in permissionsToAssign)
            {
                context.UserPermissions.Add(up);
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}

public class CloneRoleCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<CloneRoleCommand, int>
{
    public async Task<int> Handle(CloneRoleCommand request, CancellationToken cancellationToken)
    {
        var source = await context.Roles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == request.SourceRoleId, cancellationToken)
            ?? throw new NotFoundException("SOURCE_ROLE_NOT_FOUND", "Không tìm thấy vai trò nguồn.");

        // Validation: Cấp của role mới phải >= cấp của người tạo
        if (source.Level < currentUserService.MinRoleLevel)
            throw new ForbiddenException("ROLE_LEVEL_INVALID", "Bạn không thể sao chép vai trò có cấp cao hơn cấp của bạn.");

        var newRole = new Role
        {
            Name = request.NewName,
            Level = source.Level,
            Description = $"Clone from {source.Name}. {source.Description}",
            IsActive = true
        };

        context.Roles.Add(newRole);
        await context.SaveChangesAsync(cancellationToken);

        foreach (var p in source.RolePermissions)
        {
            context.RolePermissions.Add(new RolePermission
            {
                RoleId = newRole.Id,
                PermissionId = p.PermissionId,
                DataScope = p.DataScope
            });
        }

        context.RoleChangeLogs.Add(new RoleChangeLog
        {
            RoleId = newRole.Id,
            UserId = currentUserService.UserId,
            Username = currentUserService.Username ?? "system",
            Action = RoleChangeAction.ROLE_CLONED,
            OldValue = source.Name,
            NewValue = newRole.Name
        });

        await context.SaveChangesAsync(cancellationToken);
        return newRole.Id;
    }
}

public class AssignUserRolesCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<AssignUserRolesCommand>
{
    public async Task Handle(AssignUserRolesCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy nhân viên.");

        var scope = currentUserService.GetDataScope("user-role:assign");
        if (scope == DataScope.SITE && user.SiteId != currentUserService.SiteId)
        {
            throw new ForbiddenException("Bạn không có quyền gán vai trò cho nhân viên thuộc site khác.");
        }

        if (request.RoleIds.Count == 0)
            throw new ValidationException(new Dictionary<string, string[]> { { "RoleIds", new[] { "Nhân viên phải có ít nhất 1 vai trò." } } });

        var requestedRoles = await context.Roles
            .Where(r => request.RoleIds.Contains(r.Id))
            .ToListAsync(cancellationToken);

        // Validation: Không được gán role có cấp cao hơn cấp của người thực hiện
        var invalidRoles = requestedRoles.Where(r => r.Level < currentUserService.MinRoleLevel).ToList();
        if (invalidRoles.Any())
        {
            var roleNames = string.Join(", ", invalidRoles.Select(r => r.Name));
            throw new ForbiddenException("ROLE_LEVEL_INVALID", $"Bạn không có quyền gán các vai trò có cấp cao hơn cấp của bạn: {roleNames}");
        }

        var existing = await context.UserRoles.Where(x => x.UserId == request.UserId).ToListAsync(cancellationToken);
        context.UserRoles.RemoveRange(existing);

        foreach (var roleId in request.RoleIds)
        {
            context.UserRoles.Add(new HR.Domain.Entities.UserRole { UserId = (int)request.UserId, RoleId = roleId });
        }

        // Cập nhật lại user_permissions dựa vào các role mới được gán
        var existingUserPerms = await context.UserPermissions
            .Where(x => x.UserId == request.UserId)
            .ToListAsync(cancellationToken);
        context.UserPermissions.RemoveRange(existingUserPerms);

        var rolePermissions = await context.RolePermissions
            .Where(rp => request.RoleIds.Contains(rp.RoleId))
            .ToListAsync(cancellationToken);

        var permissionsToAssign = rolePermissions
            .GroupBy(rp => rp.PermissionId)
            .Select(g => new UserPermission
            {
                UserId = request.UserId,
                PermissionId = g.Key,
                DataScope = g.Min(rp => rp.DataScope)
            });

        foreach (var up in permissionsToAssign)
        {
            context.UserPermissions.Add(up);
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}

public class AssignUsersToRoleCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<AssignUsersToRoleCommand>
{
    public async Task Handle(AssignUsersToRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken)
            ?? throw new NotFoundException("ROLE_NOT_FOUND", "Không tìm thấy vai trò.");

        var scope = currentUserService.GetDataScope("user-role:assign");
        
        var existing = await context.UserRoles
            .Include(ur => ur.User)
            .Where(x => x.RoleId == request.RoleId)
            .ToListAsync(cancellationToken);

        if (scope == DataScope.SITE)
        {
            var siteId = currentUserService.SiteId;
            var toRemove = existing.Where(ur => ur.User.SiteId == siteId).ToList();
            context.UserRoles.RemoveRange(toRemove);
        }
        else
        {
            context.UserRoles.RemoveRange(existing);
        }

        foreach (var userId in request.UserIds)
        {
            var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null) continue;

            if (scope == DataScope.SITE && user.SiteId != currentUserService.SiteId) continue;

            context.UserRoles.Add(new HR.Domain.Entities.UserRole { UserId = userId, RoleId = request.RoleId });
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}

