using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Candidate : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime? BirthDate { get; set; }
    public Gender? Gender { get; set; }
    public string? Objective { get; set; }
    public CandidateVisibilityStatus VisibilityStatus { get; set; } = CandidateVisibilityStatus.PRIVATE;
    public string? ExperienceSummary { get; set; }
    public string? Skills { get; set; }

    [NotMapped]
    public int UserId { get => Id; set => Id = value; }

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<CandidateCv> CandidateCvs { get; set; } = new List<CandidateCv>();
    public ICollection<CandidateEducation> Educations { get; set; } = new List<CandidateEducation>();
    public ICollection<CandidateExperience> Experiences { get; set; } = new List<CandidateExperience>();
    public ICollection<CandidateProject> Projects { get; set; } = new List<CandidateProject>();
    public ICollection<CandidateCertificate> Certificates { get; set; } = new List<CandidateCertificate>();
    public ICollection<CandidateSkill> CandidateSkills { get; set; } = new List<CandidateSkill>();
}
