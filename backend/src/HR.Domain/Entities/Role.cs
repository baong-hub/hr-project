using System.Collections.Generic;

namespace HR.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int Level { get; set; }
    public int RoleLevelId { get; set; }

    // Navigation
    public RoleLevel RoleLevel { get; set; } = null!;
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
    public ICollection<UserRole> UserRoles { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
}
