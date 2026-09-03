using System;

namespace HR.Application.Notifications.Dtos;

public record NotificationDto(
    int Id,
    string Title,
    string Content,
    string NotificationType,
    bool IsRead,
    string? RedirectUrl,
    DateTime CreatedAt
);
