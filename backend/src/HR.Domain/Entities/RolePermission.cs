using HR.Domain.Enums;

namespace HR.Domain.Entities;

/// <summary>Bảng trung gian N-N: Role <-> Permission. Composite PK: (RoleId, PermissionId, DataScope).</summary>
public class RolePermission
{
    public int RoleId { get; set; }
    public int PermissionId { get; set; }
    public DataScope DataScope { get; set; } = DataScope.OWN;

    // Navigation
    public Role Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}

