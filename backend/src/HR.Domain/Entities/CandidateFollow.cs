using System;

namespace HR.Domain.Entities;

public class CandidateFollow
{
    public int CandidateId { get; set; }
    public int CompanyId { get; set; }
    public DateTime FollowedAt { get; set; }

    // Navigation properties
    public Candidate Candidate { get; set; } = null!;
    public Company Company { get; set; } = null!;
}
