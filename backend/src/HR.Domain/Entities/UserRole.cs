namespace HR.Domain.Entities;

/// <summary>Bảng trung gian N-N: User &lt;-&gt; Role. Composite PK bắt buộc.</summary>
public class UserRole
{
    public int UserId { get; set; }
    public int RoleId { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}

