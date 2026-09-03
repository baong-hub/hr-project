using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class TechnicalTestConfiguration : IEntityTypeConfiguration<TechnicalTest>
{
    public void Configure(EntityTypeBuilder<TechnicalTest> builder)
    {
        builder.ToTable("technical_tests");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.ApplicationId)
            .HasColumnName("application_id")
            .IsRequired();

        builder.Property(x => x.TestType)
            .HasColumnName("test_type")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.DurationMinutes)
            .HasColumnName("duration_minutes")
            .HasColumnType("int")
            .IsRequired();

        builder.Property(x => x.Score)
            .HasColumnName("score")
            .HasColumnType("int")
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(TechnicalTestStatus.FAILED)
            .IsRequired();

        builder.Property(x => x.Notes)
            .HasColumnName("notes")
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
        builder.HasOne(x => x.Application)
            .WithMany()
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);

        // Indexes
        builder.HasIndex(x => x.ApplicationId).HasDatabaseName("idx_technical_tests_application_id");
    }
}
