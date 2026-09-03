using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class CandidateEducationConfiguration : IEntityTypeConfiguration<CandidateEducation>
{
    public void Configure(EntityTypeBuilder<CandidateEducation> builder)
    {
        builder.ToTable("candidate_educations");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId)
            .HasColumnName("candidate_id")
            .IsRequired();

        builder.Property(x => x.SchoolName)
            .HasColumnName("school_name")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Major)
            .HasColumnName("major")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Degree)
            .HasColumnName("degree")
            .HasMaxLength(50);

        builder.Property(x => x.StartDate)
            .HasColumnName("start_date")
            .HasColumnType("date")
            .IsRequired();

        builder.Property(x => x.EndDate)
            .HasColumnName("end_date")
            .HasColumnType("date");

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasColumnType("text");

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
            .WithMany(c => c.Educations)
            .HasForeignKey(x => x.CandidateId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_candidate_educations_candidates");

        // Soft delete query filter
        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
