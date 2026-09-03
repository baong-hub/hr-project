using System.Collections.Generic;

namespace HR.Domain.Entities;

public class Skill : BaseEntity
{
    public string SkillName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? RelatedSkills { get; set; }

    // Navigation
    public ICollection<CandidateSkill> CandidateSkills { get; set; } = new List<CandidateSkill>();
}
