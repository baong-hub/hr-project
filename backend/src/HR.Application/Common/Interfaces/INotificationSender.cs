using System.Threading;
using System.Threading.Tasks;
using HR.Domain.Enums;

namespace HR.Application.Common.Interfaces;

public interface INotificationSender
{
    Task SendNotificationAsync(
        int userId,
        string title,
        string content,
        NotificationType type,
        string? redirectUrl = null,
        CancellationToken cancellationToken = default);
}
