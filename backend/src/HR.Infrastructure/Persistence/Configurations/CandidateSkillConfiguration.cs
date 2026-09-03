using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class CandidateSkillConfiguration : IEntityTypeConfiguration<CandidateSkill>
{
    public void Configure(EntityTypeBuilder<CandidateSkill> builder)
    {
        builder.ToTable("candidate_skills");

        builder.HasKey(x => new { x.CandidateId, x.SkillId });

        builder.Property(x => x.CandidateId)
            .HasColumnName("candidate_id")
            .IsRequired();

        builder.Property(x => x.SkillId)
            .HasColumnName("skill_id")
            .IsRequired();

        builder.Property(x => x.ExperienceMonths)
            .HasColumnName("experience_months");

        // Relationships
        builder.HasOne(x => x.Candidate)
            .WithMany(c => c.CandidateSkills)
            .HasForeignKey(x => x.CandidateId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_candidate_skills_candidates");

        builder.HasOne(x => x.Skill)
            .WithMany(s => s.CandidateSkills)
            .HasForeignKey(x => x.SkillId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_candidate_skills_skills");
    }
}
