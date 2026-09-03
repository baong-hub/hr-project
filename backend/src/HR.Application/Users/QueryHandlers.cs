using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Domain.Enums;

namespace HR.Application.Users;

public class GetUsersQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService) : IRequestHandler<GetUsersQuery, PagedResult<UserListItemDto>>
{
    public async Task<PagedResult<UserListItemDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var scope = currentUserService.GetDataScope("user-role:view");
        if (scope == DataScope.OWN) scope = currentUserService.GetDataScope("user:view"); // Fallback

        var query = context.Users.Include(u => u.Site).AsNoTracking();

        if (scope == DataScope.SITE)
        {
            var siteId = request.SiteId ?? currentUserService.SiteId;
            if (siteId > 0)
            {
                if (currentUserService.AllowedSites.Contains(siteId))
                    query = query.Where(x => x.SiteId == siteId);
                else
                    query = query.Where(x => false); // Not authorized
            }
            else
                query = query.Where(x => currentUserService.AllowedSites.Contains(x.SiteId));
        }
        else // ALL
        {
            if (request.SiteId.HasValue && request.SiteId.Value > 0)
            {
                query = query.Where(x => x.SiteId == request.SiteId.Value);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.ToLower();
            query = query.Where(x => 
                x.Username.ToLower().Contains(keyword) || 
                (x.FullName != null && x.FullName.ToLower().Contains(keyword)) ||
                (x.Email != null && x.Email.ToLower().Contains(keyword)) ||
                (x.Phone != null && x.Phone.Contains(keyword)));
        }

        var total = await query.CountAsync(cancellationToken);
        
        var rawItems = await query
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .OrderByDescending(x => x.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var userIds = rawItems.Select(x => x.Id).ToList();
        var extensions = new Dictionary<int, string>();
        var userPositions = new Dictionary<int, string>();
        var userDeptNames = new Dictionary<int, string>();

        var items = rawItems.Select(x => new UserListItemDto(
            x.Id, x.Username, x.FullName, x.Email, x.Phone, x.AccountType.ToString(),
            x.SiteId, x.Site.Name, x.IsActive, x.CreatedAt,
            x.UserRoles.Select(ur => ur.Role.Name).ToList(),
            x.UserRoles.Select(ur => ur.RoleId).ToList(),
            extensions.TryGetValue(x.Id, out var ext) ? ext : null,
            userPositions.TryGetValue(x.Id, out var pos) && !string.IsNullOrWhiteSpace(pos) ? pos : null,
            userDeptNames.TryGetValue(x.Id, out var dept) && !string.IsNullOrWhiteSpace(dept) ? dept : null
        )).ToList();

        return new PagedResult<UserListItemDto>
        {
            Items = items,
            Meta = new PagingMeta { Page = request.Page, PageSize = request.PageSize, Total = total }
        };
    }
}

public class GetUserByIdQueryHandler(IApplicationDbContext context) : IRequestHandler<GetUserByIdQuery, UserDetailDto?>
{
    public async Task<UserDetailDto?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .Include(u => u.Site)
            .Include(u => u.UserSites)
            .Include(u => u.UserRoles)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user is null) return null;

        string? extExtension = null;
        string? extPassword = null;

        return new UserDetailDto(
            user.Id, user.Username, user.FullName, user.Email, user.Phone, user.Address, user.AccountType.ToString(), user.AvatarUrl,
            user.SiteId, user.Site.Name, 
            user.UserSites.Select(us => us.SiteId).ToList(),
            user.IsActive, user.CreatedAt, user.UpdatedAt,
            user.UserRoles.Select(ur => ur.RoleId).ToList(),
            extExtension,
            extPassword);
    }
}

public class GetUserDirectPermissionsQueryHandler(IApplicationDbContext context) : IRequestHandler<GetUserDirectPermissionsQuery, List<UserDirectPermissionDto>>
{
    public async Task<List<UserDirectPermissionDto>> Handle(GetUserDirectPermissionsQuery request, CancellationToken cancellationToken)
    {
        return await context.UserPermissions
            .AsNoTracking()
            .Where(up => up.UserId == request.UserId)
            .Select(up => new UserDirectPermissionDto(up.PermissionId, up.DataScope.ToString()))
            .ToListAsync(cancellationToken);
    }
}

public class GetUserPasswordQueryHandler(IApplicationDbContext context, IEncryptionService encryptionService) : IRequestHandler<GetUserPasswordQuery, string>
{
    public async Task<string> Handle(GetUserPasswordQuery request, CancellationToken cancellationToken)
    {
        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy tài khoản.");

        var encryptedData = await context.EncryptedData
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.ModuleName == "user" && x.EntityId == user.Id && x.FieldName == "password", cancellationToken);

        if (encryptedData != null)
        {
            return encryptionService.Decrypt(encryptedData.EncryptedValue);
        }

        // Chưa có dữ liệu mật khẩu đã mã hóa (tài khoản tạo trước khi có tính năng này)
        return string.Empty;
    }
}


