using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class CandidateConfiguration : IEntityTypeConfiguration<Candidate>
{
    public void Configure(EntityTypeBuilder<Candidate> builder)
    {
        builder.ToTable("candidates");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();

        builder.Property(x => x.FullName)
            .HasColumnName("full_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.AvatarUrl)
            .HasColumnName("avatar_url")
            .HasMaxLength(255);

        builder.Property(x => x.BirthDate)
            .HasColumnName("birth_date")
            .HasColumnType("date");

        builder.Property(x => x.Gender)
            .HasColumnName("gender")
            .HasConversion<string>()
            .HasMaxLength(10);

        builder.Property(x => x.Objective)
            .HasColumnName("objective")
            .HasColumnType("text");

        builder.Property(x => x.VisibilityStatus)
            .HasColumnName("visibility_status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired()
            .HasDefaultValue(CandidateVisibilityStatus.PRIVATE)
            .HasSentinel((CandidateVisibilityStatus)(-1));

        builder.Property(x => x.ExperienceSummary)
            .HasColumnName("experience_summary")
            .HasColumnType("text");

        builder.Property(x => x.Skills)
            .HasColumnName("skills")
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
        builder.HasOne(x => x.User)
            .WithOne(u => u.Candidate)
            .HasForeignKey<Candidate>(x => x.Id)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_candidates_users");

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
