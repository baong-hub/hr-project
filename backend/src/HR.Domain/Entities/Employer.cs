using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Employer : BaseEntity
{
    public int UserId { get; set; }
    public int? CompanyId { get; set; }
    public string? Position { get; set; }
    public RoleInCompany RoleInCompany { get; set; } = RoleInCompany.RECRUITER;

    // Navigation
    public User User { get; set; } = null!;
    public Company? Company { get; set; }
}
