namespace HR.Domain.Entities;

public class RoleLevel : BaseEntity
{
    public int Level { get; set; }
    public string Name { get; set; } = string.Empty;

    // Navigation
    public ICollection<Role> Roles { get; set; } = [];
}

