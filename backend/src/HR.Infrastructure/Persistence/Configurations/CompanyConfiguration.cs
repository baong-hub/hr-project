using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("companies");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.Code)
            .HasColumnName("code")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.LogoUrl)
            .HasColumnName("logo_url")
            .HasMaxLength(255);

        builder.Property(x => x.Logo)
            .HasColumnName("logo")
            .HasMaxLength(255);

        builder.Property(x => x.BannerUrl)
            .HasColumnName("banner_url")
            .HasMaxLength(255);

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasColumnType("text");

        builder.Property(x => x.Website)
            .HasColumnName("website")
            .HasMaxLength(100);

        builder.Property(x => x.SizeRange)
            .HasColumnName("size_range")
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Industry)
            .HasColumnName("industry")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.AddressList)
            .HasColumnName("address_list")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(x => x.Address)
            .HasColumnName("address")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(x => x.IsVerified)
            .HasColumnName("is_verified")
            .IsRequired();

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(x => x.TaxCode)
            .HasColumnName("tax_code")
            .HasMaxLength(20);

        builder.Property(x => x.FoundedYear)
            .HasColumnName("founded_year");

        builder.Property(x => x.Benefits)
            .HasColumnName("benefits")
            .HasColumnType("text");

        builder.Property(x => x.Contact)
            .HasColumnName("contact")
            .HasMaxLength(150);

        builder.Property(x => x.SocialLinks)
            .HasColumnName("social_links")
            .HasColumnType("json");

        builder.Property(x => x.VideoUrl)
            .HasColumnName("video_url")
            .HasMaxLength(255);

        builder.Property(x => x.OfficeGallery)
            .HasColumnName("office_gallery")
            .HasColumnType("json");

        builder.Property(x => x.CultureHighlights)
            .HasColumnName("culture_highlights")
            .HasColumnType("json");

        builder.Property(x => x.CompanyFaqs)
            .HasColumnName("company_faqs")
            .HasColumnType("json");

        builder.Property(x => x.Testimonials)
            .HasColumnName("testimonials")
            .HasColumnType("json");

        builder.Property(x => x.VerificationStatus)
            .HasColumnName("verification_status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(CompanyVerificationStatus.DRAFT)
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
        builder.HasMany(x => x.Employers)
            .WithOne(e => e.Company)
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Jobs)
            .WithOne(j => j.Company)
            .HasForeignKey(j => j.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
