using System;

namespace HR.Domain.Entities;

public class UserColumnSetting : BaseEntity
{
    public int UserId { get; set; }
    public string GridKey { get; set; } = null!;
    public string ColumnSettingsJson { get; set; } = null!;
}
