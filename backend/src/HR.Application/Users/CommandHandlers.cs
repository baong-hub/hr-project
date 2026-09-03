using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace HR.Application.Users;

public class CreateUserCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher, IEncryptionService encryptionService)
    : IRequestHandler<CreateUserCommand, int>
{
    public async Task<int> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        if (await context.Users.AnyAsync(u => u.Username == request.Username, cancellationToken))
            throw new ConflictException("USER_EXISTS", "Tên đăng nhập đã tồn tại.");

        if (!string.IsNullOrEmpty(request.Email) && await context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken))
            throw new ConflictException("EMAIL_EXISTS", "Email đã tồn tại.");

        var user = new User
        {
            Username = request.Username,
            PasswordHash = passwordHasher.Hash(request.Password),
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            AccountType = request.AccountType,
            SiteId = request.SiteId,
            IsActive = true
        };

        context.Users.Add(user);
        
        // Thêm các site mà user có quyền truy cập
        if (request.AccessibleSiteIds?.Any() == true)
        {
            foreach (var siteId in request.AccessibleSiteIds)
            {
                context.UserSites.Add(new UserSite { User = user, SiteId = siteId });
            }
        }
        else
        {
            // Mặc định cho phép truy cập site chính
            context.UserSites.Add(new UserSite { User = user, SiteId = request.SiteId });
        }

        // Gán vai trò
        if (request.RoleIds?.Any() == true)
        {
            foreach (var roleId in request.RoleIds)
            {
                context.UserRoles.Add(new UserRole { User = user, RoleId = roleId });
            }

            var rolePermissions = await context.RolePermissions
                .Where(rp => request.RoleIds.Contains(rp.RoleId))
                .ToListAsync(cancellationToken);

            var permissionsToAssign = rolePermissions
                .GroupBy(rp => rp.PermissionId)
                .Select(g => new UserPermission
                {
                    User = user,
                    PermissionId = g.Key,
                    DataScope = g.Min(rp => rp.DataScope)
                });

            foreach (var up in permissionsToAssign)
            {
                context.UserPermissions.Add(up);
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        
        context.EncryptedData.Add(new EncryptedData
        {
            ModuleName = "user",
            EntityId = user.Id,
            FieldName = "password",
            EncryptedValue = encryptionService.Encrypt(request.Password),
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        });
        await context.SaveChangesAsync(cancellationToken);
        
        return user.Id;
    }
}

public class UpdateUserCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateUserCommand>
{
    public async Task Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy tài khoản.");

        if (!string.IsNullOrEmpty(request.Email) && await context.Users.AnyAsync(u => u.Email == request.Email && u.Id != request.Id, cancellationToken))
            throw new ConflictException("EMAIL_EXISTS", "Email đã tồn tại.");

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Phone = request.Phone;
        user.Address = request.Address;
        user.AccountType = request.AccountType;
        user.SiteId = request.SiteId;
        user.IsActive = request.IsActive;

        // Cập nhật danh sách site có quyền truy cập: Xóa cũ, thêm mới
        var existingSites = await context.UserSites.Where(us => us.UserId == user.Id).ToListAsync(cancellationToken);
        context.UserSites.RemoveRange(existingSites);

        if (request.AccessibleSiteIds?.Any() == true)
        {
            foreach (var siteId in request.AccessibleSiteIds)
            {
                context.UserSites.Add(new UserSite { UserId = user.Id, SiteId = siteId });
            }
        }
        else
        {
            // Mặc định cho phép truy cập site chính
            context.UserSites.Add(new UserSite { UserId = user.Id, SiteId = request.SiteId });
        }

        // Cập nhật vai trò: Xóa cũ, thêm mới
        var existingRoles = await context.UserRoles.Where(ur => ur.UserId == user.Id).ToListAsync(cancellationToken);
        context.UserRoles.RemoveRange(existingRoles);

        if (request.RoleIds?.Any() == true)
        {
            foreach (var roleId in request.RoleIds)
            {
                context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleId });
            }
        }

        // Cập nhật lại user_permissions dựa vào các role mới được gán
        var existingUserPerms = await context.UserPermissions
            .Where(x => x.UserId == user.Id)
            .ToListAsync(cancellationToken);
        context.UserPermissions.RemoveRange(existingUserPerms);

        if (request.RoleIds?.Any() == true)
        {
            var rolePermissions = await context.RolePermissions
                .Where(rp => request.RoleIds.Contains(rp.RoleId))
                .ToListAsync(cancellationToken);

            var permissionsToAssign = rolePermissions
                .GroupBy(rp => rp.PermissionId)
                .Select(g => new UserPermission
                {
                    UserId = user.Id,
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

public class DeleteUserCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteUserCommand>
{
    public async Task Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy tài khoản.");

        user.IsActive = false;
        await context.SaveChangesAsync(cancellationToken);
    }
}

public class ResetPasswordCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher, IEncryptionService encryptionService)
    : IRequestHandler<ResetPasswordCommand>
{
    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy tài khoản.");

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);

        var encryptedData = await context.EncryptedData
            .FirstOrDefaultAsync(x => x.ModuleName == "user" && x.EntityId == user.Id && x.FieldName == "password", cancellationToken);

        if (encryptedData == null)
        {
            context.EncryptedData.Add(new EncryptedData
            {
                ModuleName = "user",
                EntityId = user.Id,
                FieldName = "password",
                EncryptedValue = encryptionService.Encrypt(request.NewPassword),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            });
        }
        else
        {
            encryptedData.EncryptedValue = encryptionService.Encrypt(request.NewPassword);
            encryptedData.UpdatedAt = DateTime.Now;
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}

public class UploadUserAvatarCommandHandler(IApplicationDbContext context, IWebHostEnvironmentAccessor envAccessor)
    : IRequestHandler<UploadUserAvatarCommand, string>
{
    public async Task<string> Handle(UploadUserAvatarCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy tài khoản.");

        var folder = Path.Combine(envAccessor.WebRootPath, "uploads", "avatars", request.UserId.ToString());
        Directory.CreateDirectory(folder);

        var ext = Path.GetExtension(request.FileName).ToLowerInvariant();
        var fileName = $"avatar_{DateTime.Now:yyyyMMddHHmmss}{ext}";
        var filePath = Path.Combine(folder, fileName);

        // Resize avatar 300x300
        using var image = await Image.LoadAsync(request.FileStream, cancellationToken);
        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(300, 300),
            Mode = ResizeMode.Crop
        }));
        await image.SaveAsync(filePath, cancellationToken);

        var relativeUrl = $"/uploads/avatars/{request.UserId}/{fileName}";
        user.AvatarUrl = relativeUrl;
        await context.SaveChangesAsync(cancellationToken);

        return relativeUrl;
    }
}

public class AssignUserDirectPermissionsCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AssignUserDirectPermissionsCommand>
{
    public async Task Handle(AssignUserDirectPermissionsCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy tài khoản.");

        var existing = await context.UserPermissions
            .Where(x => x.UserId == request.UserId)
            .ToListAsync(cancellationToken);

        context.UserPermissions.RemoveRange(existing);

        foreach (var p in request.Permissions)
        {
            context.UserPermissions.Add(new UserPermission
            {
                UserId = request.UserId,
                PermissionId = p.PermissionId,
                DataScope = p.DataScope,
                IsCustom = true
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}


