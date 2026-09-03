using System;

namespace HR.Domain.Entities;

public class UserSession : BaseEntity
{
    public string SessionId { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string? DeviceName { get; set; }
    public string? Browser { get; set; }
    public string? IpAddress { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime LastActiveAt { get; set; } = DateTime.Now;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;
    public DateTime? RevokedAt { get; set; }
    public int? RevokedBy { get; set; }

    public User? User { get; set; }
}

