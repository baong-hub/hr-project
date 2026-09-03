using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class RecruitmentCampaignConfiguration : IEntityTypeConfiguration<RecruitmentCampaign>
{
    public void Configure(EntityTypeBuilder<RecruitmentCampaign> builder)
    {
        builder.ToTable("recruitment_campaigns");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime(6)").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime(6)");
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at").HasColumnType("datetime(6)");

        builder.HasQueryFilter(x => x.DeletedAt == null);

        builder.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired();

        builder.Property(x => x.Title)
            .HasColumnName("title")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Budget)
            .HasColumnName("budget")
            .HasColumnType("decimal(18,2)")
            .HasDefaultValue(0.00m)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(30)
            .HasConversion<string>()
            .HasDefaultValue(HR.Domain.Enums.CampaignStatus.ACTIVE)
            .IsRequired();

        // Relationships
        builder.HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
