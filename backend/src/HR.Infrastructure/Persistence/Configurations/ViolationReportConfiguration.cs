using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class ViolationReportConfiguration : IEntityTypeConfiguration<ViolationReport>
{
    public void Configure(EntityTypeBuilder<ViolationReport> builder)
    {
        builder.ToTable("violation_reports");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime(6)").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime(6)");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at").HasColumnType("datetime(6)");

        builder.HasQueryFilter(x => x.DeletedAt == null);

        builder.Property(x => x.ReporterId)
            .HasColumnName("reporter_id")
            .IsRequired();

        builder.Property(x => x.TargetType)
            .HasColumnName("target_type")
            .HasMaxLength(30)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(x => x.TargetId)
            .HasColumnName("target_id")
            .IsRequired();

        builder.Property(x => x.Reason)
            .HasColumnName("reason")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasColumnType("text");

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(30)
            .HasConversion<string>()
            .HasDefaultValue(HR.Domain.Enums.ViolationStatus.PENDING)
            .IsRequired();

        builder.Property(x => x.Resolution)
            .HasColumnName("resolution")
            .HasMaxLength(50);

        builder.Property(x => x.ResolvedById)
            .HasColumnName("resolved_by");

        // Relationships
        builder.HasOne(x => x.Reporter)
            .WithMany()
            .HasForeignKey(x => x.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ResolvedBy)
            .WithMany()
            .HasForeignKey(x => x.ResolvedById)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
