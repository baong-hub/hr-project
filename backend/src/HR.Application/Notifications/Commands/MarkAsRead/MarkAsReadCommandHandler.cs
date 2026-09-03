using System.Threading;
using System.Threading.Tasks;
using MediatR;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;

namespace HR.Application.Notifications.Commands.MarkAsRead;

public class MarkAsReadCommandHandler(
    IApplicationDbContext context, 
    ICurrentUserService currentUserService) 
    : IRequestHandler<MarkAsReadCommand, bool>
{
    private readonly IApplicationDbContext _context = context;
    private readonly ICurrentUserService _currentUserService = currentUserService;

    public async Task<bool> Handle(
        MarkAsReadCommand request, 
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var notification = await _context.Notifications.FindAsync(
            [request.Id], 
            cancellationToken);

        if (notification == null)
        {
            throw new NotFoundException(
                "NOTIFICATION_NOT_FOUND", 
                "Thông báo không tồn tại");
        }

        if (notification.UserId != userId)
        {
            throw new ForbiddenException(
                "NOTIFICATION_FORBIDDEN", 
                "Bạn không có quyền thao tác trên thông báo này");
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
