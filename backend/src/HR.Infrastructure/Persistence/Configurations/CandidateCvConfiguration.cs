using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class CandidateCvConfiguration : IEntityTypeConfiguration<CandidateCv>
{
    public void Configure(EntityTypeBuilder<CandidateCv> builder)
    {
        builder.ToTable("candidate_cvs");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId)
            .HasColumnName("candidate_id")
            .IsRequired();

        builder.Property(x => x.CvTitle)
            .HasColumnName("cv_title")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.FileUrl)
            .HasColumnName("file_url")
            .HasMaxLength(255);

        builder.Property(x => x.IsDefault)
            .HasColumnName("is_default")
            .HasColumnType("tinyint(1)")
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.FileSizeBytes)
            .HasColumnName("file_size_bytes");

        builder.Property(x => x.CvType)
            .HasColumnName("cv_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue(CvType.UPLOAD);

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
        builder.HasOne(x => x.Candidate)
            .WithMany(c => c.CandidateCvs)
            .HasForeignKey(x => x.CandidateId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_candidate_cvs_candidates");

        // Soft delete query filter
        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
