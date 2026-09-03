using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class ApplicationConfiguration : IEntityTypeConfiguration<HR.Domain.Entities.Application>
{
    public void Configure(EntityTypeBuilder<HR.Domain.Entities.Application> builder)
    {
        builder.ToTable("applications");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.JobId)
            .HasColumnName("job_id")
            .IsRequired();

        builder.Property(x => x.CandidateId)
            .HasColumnName("candidate_id")
            .IsRequired();

        builder.Property(x => x.CandidateCvId)
            .HasColumnName("candidate_cv_id")
            .IsRequired();

        builder.Property(x => x.CoverLetter)
            .HasColumnName("cover_letter")
            .HasColumnType("text")
            .HasMaxLength(3000);

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(HR.Domain.Enums.ApplicationStatus.APPLIED)
            .IsRequired();

        builder.Property(x => x.MatchScore)
            .HasColumnName("match_score")
            .HasColumnType("int");

        builder.Property(x => x.AppliedAt)
            .HasColumnName("applied_at")
            .HasColumnType("datetime(6)")
            .IsRequired();

        // Audit columns
        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime(6)")
            .IsRequired();

        builder.Property(x => x.CreatedBy)
            .HasColumnName("created_by");

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("datetime(6)")
            .IsRequired();

        builder.Property(x => x.UpdatedBy)
            .HasColumnName("updated_by");

        builder.Property(x => x.DeletedAt)
            .HasColumnName("deleted_at")
            .HasColumnType("datetime(6)");

        builder.Property(x => x.DeletedBy)
            .HasColumnName("deleted_by");

        // Relationships
        builder.HasOne(x => x.Job)
            .WithMany()
            .HasForeignKey(x => x.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Candidate)
            .WithMany()
            .HasForeignKey(x => x.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.CandidateCv)
            .WithMany()
            .HasForeignKey(x => x.CandidateCvId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);

        // Unique index candidate nộp đơn vào 1 tin tuyển dụng tối đa 1 lần
        builder.HasIndex(x => new { x.CandidateId, x.JobId })
            .IsUnique()
            .HasDatabaseName("uq_applications_candidate_job");

        // Indexes for performance
        builder.HasIndex(x => x.JobId).HasDatabaseName("idx_applications_job_id");
        builder.HasIndex(x => x.CandidateId).HasDatabaseName("idx_applications_candidate_id");
        builder.HasIndex(x => x.CandidateCvId).HasDatabaseName("idx_applications_cv_id");
    }
}
