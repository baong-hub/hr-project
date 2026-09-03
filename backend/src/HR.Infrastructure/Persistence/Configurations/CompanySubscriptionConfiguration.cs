using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class CompanySubscriptionConfiguration : IEntityTypeConfiguration<CompanySubscription>
{
    public void Configure(EntityTypeBuilder<CompanySubscription> builder)
    {
        builder.ToTable("company_subscriptions");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime(6)").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime(6)");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at").HasColumnType("datetime(6)");

        builder.HasQueryFilter(x => x.DeletedAt == null);

        builder.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired();

        builder.Property(x => x.PlanName)
            .HasColumnName("plan_name")
            .HasMaxLength(50)
            .HasConversion<string>()
            .HasDefaultValue(HR.Domain.Enums.SubscriptionPlan.FREE)
            .IsRequired();

        builder.Property(x => x.MaxJobs)
            .HasColumnName("max_jobs")
            .HasDefaultValue(3)
            .IsRequired();

        builder.Property(x => x.MaxCvViews)
            .HasColumnName("max_cv_views")
            .HasDefaultValue(10)
            .IsRequired();

        builder.Property(x => x.MaxRecruiters)
            .HasColumnName("max_recruiters")
            .HasDefaultValue(1)
            .IsRequired();

        builder.Property(x => x.AiScreening)
            .HasColumnName("ai_screening")
            .HasColumnType("tinyint(1)")
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(x => x.StartDate)
            .HasColumnName("start_date")
            .HasColumnType("date")
            .IsRequired();

        builder.Property(x => x.EndDate)
            .HasColumnName("end_date")
            .HasColumnType("date")
            .IsRequired();

        // Relationships
        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
