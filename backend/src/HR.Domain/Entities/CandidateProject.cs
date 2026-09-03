namespace HR.Domain.Entities;

public class CandidateProject : BaseEntity
{
    public int CandidateId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Technologies { get; set; }
    public string? Description { get; set; }

    // Navigation
    public Candidate Candidate { get; set; } = null!;
}
