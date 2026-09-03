using System;

namespace HR.Domain.Entities;

public class SavedJob
{
    public int CandidateId { get; set; }
    public int JobId { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.Now;

    // Navigation
    public Candidate Candidate { get; set; } = null!;
    public Job Job { get; set; } = null!;
}
