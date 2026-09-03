using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;
using HR.Application.Notifications.Dtos;

namespace HR.Application.Notifications.Queries.GetUnreadCount;

public class GetUnreadCountQueryHandler(
    IApplicationDbContext context, 
    ICurrentUserService currentUserService) 
    : IRequestHandler<GetUnreadCountQuery, UnreadCountDto>
{
    private readonly IApplicationDbContext _context = context;
    private readonly ICurrentUserService _currentUserService = currentUserService;

    public async Task<UnreadCountDto> Handle(
        GetUnreadCountQuery request, 
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var count = await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);

        return new UnreadCountDto(count);
    }
}
