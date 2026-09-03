using System;

namespace HR.Domain.Entities;

public class JobViewLog
{
    public long Id { get; set; }
    public int JobId { get; set; }
    public int? UserId { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public DateTime ViewedAt { get; set; } = DateTime.Now;

    // Navigation properties
    public Job Job { get; set; } = null!;
    public User? User { get; set; }
}
