using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Notifications.Dtos;

namespace HR.Application.Notifications.Queries.GetNotifications;

public class GetNotificationsQueryHandler(
    IApplicationDbContext context, 
    ICurrentUserService currentUserService) 
    : IRequestHandler<GetNotificationsQuery, PagedResult<NotificationDto>>
{
    private readonly IApplicationDbContext _context = context;
    private readonly ICurrentUserService _currentUserService = currentUserService;

    public async Task<PagedResult<NotificationDto>> Handle(
        GetNotificationsQuery request, 
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var totalItems = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.Title,
                n.Content,
                n.NotificationType.ToString(),
                n.IsRead,
                n.RedirectUrl,
                n.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationDto>
        {
            Items = items,
            Meta = new PagingMeta
            {
                Page = request.Page,
                PageSize = request.PageSize,
                Total = totalItems
            }
        };
    }
}
