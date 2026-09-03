namespace HR.Domain.Entities;

public class CandidateSkill
{
    public int CandidateId { get; set; }
    public int SkillId { get; set; }
    public int? ExperienceMonths { get; set; }

    // Navigation
    public Candidate Candidate { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
