using System.Collections.Generic;

namespace HR.Domain.Entities;

public class Permission : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int MenuId { get; set; }

    // Navigation
    public Menu Menu { get; set; } = null!;
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
