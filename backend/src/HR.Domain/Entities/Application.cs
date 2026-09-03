using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Application : BaseEntity
{
    public int JobId { get; set; }
    public int CandidateId { get; set; }
    public int CandidateCvId { get; set; }
    public string? CoverLetter { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.APPLIED;
    public int? MatchScore { get; set; }
    public DateTime AppliedAt { get; set; } = DateTime.Now;

    // Navigation
    public Job Job { get; set; } = null!;
    public Candidate Candidate { get; set; } = null!;
    public CandidateCv CandidateCv { get; set; } = null!;
}
