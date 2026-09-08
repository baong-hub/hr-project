namespace HR.Domain.Entities;

/// <summary>Bảng cơ cấu tổ chức - Phòng ban (Department)</summary>
public class Department : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentId { get; set; }
    public int? ManagerUserId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Department? Parent { get; set; }
    public User? Manager { get; set; }
    public ICollection<Department> Children { get; set; } = new List<Department>();
}
