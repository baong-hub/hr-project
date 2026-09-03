using HR.Domain.Enums;

namespace HR.Application.UserSettings.Dtos;

public class UserSettingDto
{
    public ThemeMode ThemeMode { get; set; }
    public string Language { get; set; } = null!;
    public DateTime UpdatedAt { get; set; }
}

public class UpdateThemeDto
{
    public ThemeMode ThemeMode { get; set; }
}

public class UpdateLanguageDto
{
    public string Language { get; set; } = null!;
}

