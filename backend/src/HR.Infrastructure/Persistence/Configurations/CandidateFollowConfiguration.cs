using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class CandidateFollowConfiguration : IEntityTypeConfiguration<CandidateFollow>
{
    public void Configure(EntityTypeBuilder<CandidateFollow> builder)
    {
        builder.ToTable("candidate_follows");

        // Composite Primary Key
        builder.HasKey(x => new { x.CandidateId, x.CompanyId });

        builder.Property(x => x.CandidateId)
            .HasColumnName("candidate_id")
            .IsRequired();

        builder.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired();

        builder.Property(x => x.FollowedAt)
            .HasColumnName("followed_at")
            .HasColumnType("datetime(6)")
            .IsRequired();

        // Relationships
        builder.HasOne(x => x.Candidate)
            .WithMany()
            .HasForeignKey(x => x.CandidateId)
            .HasConstraintName("fk_candidate_follows_candidates")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Company)
            .WithMany(c => c.CandidateFollows)
            .HasForeignKey(x => x.CompanyId)
            .HasConstraintName("fk_candidate_follows_companies")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
