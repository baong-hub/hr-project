using HR.Application.Common.Models;
using MediatR;

namespace HR.Application.Users;

public record GetUsersQuery(string? Keyword, int Page = 1, int PageSize = 20, int? SiteId = null) : IRequest<PagedResult<UserListItemDto>>;

public record GetUserByIdQuery(int Id) : IRequest<UserDetailDto?>;

public record GetUserPasswordQuery(int Id) : IRequest<string>;

public record GetUserDirectPermissionsQuery(int UserId) : IRequest<List<UserDirectPermissionDto>>;


