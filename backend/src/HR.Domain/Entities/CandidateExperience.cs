using System;

namespace HR.Domain.Entities;

public class CandidateExperience : BaseEntity
{
    public int CandidateId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Description { get; set; }

    // Navigation
    public Candidate Candidate { get; set; } = null!;
}
