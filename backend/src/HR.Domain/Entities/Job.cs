using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Job : BaseEntity
{
    public int CompanyId { get; set; }
    public int EmployerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string Category { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = string.Empty;
    public string Country { get; set; } = "VIETNAM";
    public string City { get; set; } = string.Empty;
    public string? District { get; set; }
    public string? Office { get; set; }
    public WorkMode WorkMode { get; set; } = WorkMode.ONSITE;
    public SalaryType SalaryType { get; set; } = SalaryType.NEGOTIABLE;
    public decimal? SalaryFrom { get; set; }
    public decimal? SalaryTo { get; set; }
    public string ExperienceLevel { get; set; } = string.Empty;
    public int? ExperienceYearsMin { get; set; }
    public string? Education { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string? Benefits { get; set; }
    public string? ProbationDuration { get; set; }
    public int Openings { get; set; } = 1;
    public int HiredCount { get; set; } = 0;
    public JobStatus Status { get; set; } = JobStatus.DRAFT;
    public DateTime ExpiredAt { get; set; }

    // Promotion & Monetization Add-ons
    public bool IsFeatured { get; set; } = false;
    public DateTime? FeaturedUntil { get; set; }
    public bool IsUrgent { get; set; } = false;
    public DateTime? UrgentUntil { get; set; }
    public int PriorityOrder { get; set; } = 0;

    // Navigation
    public Company Company { get; set; } = null!;
    public Employer Employer { get; set; } = null!;
}
