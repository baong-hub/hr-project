using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class RoleChangeLog : BaseEntity
{
    public int RoleId { get; set; }
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public RoleChangeAction Action { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Reason { get; set; }

    // Navigation
    public Role Role { get; set; } = null!;
}

