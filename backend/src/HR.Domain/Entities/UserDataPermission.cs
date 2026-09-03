namespace HR.Domain.Entities;

public class UserDataPermission
{
    public int UserId { get; set; }
    public int TargetUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public int? CreatedBy { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public User TargetUser { get; set; } = null!;
}

