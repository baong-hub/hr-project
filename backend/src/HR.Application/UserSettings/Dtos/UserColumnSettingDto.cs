using System;

namespace HR.Application.UserSettings.Dtos;

public class UserColumnSettingDto
{
    public string GridKey { get; set; } = null!;
    public string ColumnSettingsJson { get; set; } = null!;
    public DateTime UpdatedAt { get; set; }
}

