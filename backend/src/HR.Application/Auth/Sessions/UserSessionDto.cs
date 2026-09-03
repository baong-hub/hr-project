using System;

namespace HR.Application.Auth.Sessions;

public class UserSessionDto
{
    public int Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public string? Browser { get; set; }
    public string? IpAddress { get; set; }
    public DateTime LoginTime { get; set; }
    public DateTime LastActiveAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public bool IsCurrentSession { get; set; }
}

