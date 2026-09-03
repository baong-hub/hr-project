using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class UserSetting : BaseEntity
{
    public int UserId { get; set; }
    public ThemeMode ThemeMode { get; set; } = ThemeMode.Light;
    public string Language { get; set; } = "vi";

    // Navigation
    public User User { get; set; } = null!;
}

