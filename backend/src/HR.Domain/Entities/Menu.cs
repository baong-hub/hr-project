namespace HR.Domain.Entities;

public class Menu : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string Code { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public string? Route { get; set; }
    public string? Icon { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Menu? Parent { get; set; }
    public ICollection<Menu> Children { get; set; } = [];
    public ICollection<Permission> Permissions { get; set; } = [];
}

