using System;

namespace HR.Domain.Entities;

public class CandidateEducation : BaseEntity
{
    public int CandidateId { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string Major { get; set; } = string.Empty;
    public string? Degree { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Description { get; set; }

    // Navigation
    public Candidate Candidate { get; set; } = null!;
}
