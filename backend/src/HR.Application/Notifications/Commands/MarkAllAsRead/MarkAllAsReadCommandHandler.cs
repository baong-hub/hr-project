using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;

namespace HR.Application.Notifications.Commands.MarkAllAsRead;

public class MarkAllAsReadCommandHandler(
    IApplicationDbContext context, 
    ICurrentUserService currentUserService) 
    : IRequestHandler<MarkAllAsReadCommand, bool>
{
    private readonly IApplicationDbContext _context = context;
    private readonly ICurrentUserService _currentUserService = currentUserService;

    public async Task<bool> Handle(
        MarkAllAsReadCommand request, 
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(cancellationToken);

        if (unreadNotifications.Any())
        {
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
