namespace HR.Domain.Entities;

/// <summary>Bảng đơn vị / cơ sở (Site)</summary>
public class Site : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? RegisteredName { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;

    public int CompanyId { get; set; } = 1;
    public Company Company { get; set; } = null!;

    // Navigation
    public ICollection<UserSite> UserSites { get; set; } = [];
}
