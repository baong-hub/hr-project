using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class UserPermission
{
    public int UserId { get; set; }
    public int PermissionId { get; set; }
    public DataScope DataScope { get; set; }
    public bool IsCustom { get; set; } = false;

    // Navigation
    public User User { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}

