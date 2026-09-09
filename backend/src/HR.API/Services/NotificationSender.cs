using System;
using System.Threading;
using System.Threading.Tasks;
using HR.API.Hubs;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HR.API.Services;

public class NotificationSender(
    IApplicationDbContext context,
    IHubContext<NotificationHub> notificationHub,
    ILogger<NotificationSender> logger) : INotificationSender
{
    public async Task SendNotificationAsync(
        int userId,
        string title,
        string content,
        NotificationType type,
        string? redirectUrl = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Content = content,
                NotificationType = type,
                IsRead = false,
                RedirectUrl = redirectUrl,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            context.Notifications.Add(notification);
            await context.SaveChangesAsync(cancellationToken);

            // Real-time broadcast to user's SignalR connection
            await notificationHub.Clients.User(userId.ToString()).SendAsync(
                "ReceiveNotification",
                new
                {
                    id = notification.Id,
                    userId = notification.UserId,
                    title = notification.Title,
                    content = notification.Content,
                    notificationType = notification.NotificationType.ToString(),
                    isRead = notification.IsRead,
                    redirectUrl = notification.RedirectUrl,
                    createdAt = notification.CreatedAt
                },
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send notification to User {UserId}", userId);
        }
    }
}
