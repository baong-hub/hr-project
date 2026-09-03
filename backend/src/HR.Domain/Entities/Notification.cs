using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Notification : BaseEntity
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NotificationType NotificationType { get; set; }
    public bool IsRead { get; set; } = false;
    public string? RedirectUrl { get; set; }

    // Navigation property
    public User User { get; set; } = null!;
}
