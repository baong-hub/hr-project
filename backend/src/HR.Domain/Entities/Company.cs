using System.Collections.Generic;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Company : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Logo { get; set; }
    public string? BannerUrl { get; set; }
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string SizeRange { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string AddressList { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public string? TaxCode { get; set; }
    public int? FoundedYear { get; set; }
    public string? Benefits { get; set; }
    public string? Contact { get; set; }
    public string? SocialLinks { get; set; } // Represented as JSON string in C#
    public CompanyVerificationStatus VerificationStatus { get; set; } = CompanyVerificationStatus.DRAFT;

    // Navigation properties
    public ICollection<Employer> Employers { get; set; } = new List<Employer>();
    public ICollection<Job> Jobs { get; set; } = new List<Job>();
    public ICollection<CandidateFollow> CandidateFollows { get; set; } = new List<CandidateFollow>();
}
