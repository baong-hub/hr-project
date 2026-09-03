namespace HR.Domain.Entities;

/// <summary>Bảng cấu hình hệ thống và nghiệp vụ động</summary>
public class SettingConfig : BaseEntity
{
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
    public int? SiteId { get; set; }
    public string? Group { get; set; }
    public string? Description { get; set; }

    // Navigation
    public virtual Site? Site { get; set; }
}

