using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class SavedJobConfiguration : IEntityTypeConfiguration<SavedJob>
{
    public void Configure(EntityTypeBuilder<SavedJob> builder)
    {
        builder.ToTable("saved_jobs");

        // Composite Primary Key
        builder.HasKey(x => new { x.CandidateId, x.JobId });

        builder.Property(x => x.CandidateId)
            .HasColumnName("candidate_id")
            .IsRequired();

        builder.Property(x => x.JobId)
            .HasColumnName("job_id")
            .IsRequired();

        builder.Property(x => x.SavedAt)
            .HasColumnName("saved_at")
            .HasColumnType("datetime(6)")
            .IsRequired();

        // Relationships
        builder.HasOne(x => x.Candidate)
            .WithMany()
            .HasForeignKey(x => x.CandidateId)
            .HasConstraintName("fk_saved_jobs_candidates")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Job)
            .WithMany()
            .HasForeignKey(x => x.JobId)
            .HasConstraintName("fk_saved_jobs_jobs")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
