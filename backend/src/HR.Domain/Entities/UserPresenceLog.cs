namespace HR.Domain.Entities;

public class UserPresenceLog : BaseEntity
{
    public int UserId { get; set; }
    public DateTime LoginTime { get; set; }
    public DateTime? LogoutTime { get; set; }
    public int TabCount { get; set; }

    public User? User { get; set; }
}

