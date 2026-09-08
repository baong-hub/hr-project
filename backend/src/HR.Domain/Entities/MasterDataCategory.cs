namespace HR.Domain.Entities;

/// <summary>Bảng danh mục dùng chung (Master Data Category)</summary>
public class MasterDataCategory : BaseEntity
{
    /// <summary>Loại danh mục: Skill, Level, Industry, SalaryRange, Location, JobType, WorkForm</summary>
    public string Type { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
