using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class EmployerConfiguration : IEntityTypeConfiguration<Employer>
{
    public void Configure(EntityTypeBuilder<Employer> builder)
    {
        builder.ToTable("employers");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired(false);

        builder.Property(x => x.Position)
            .HasColumnName("position")
            .HasMaxLength(100);

        builder.Property(x => x.RoleInCompany)
            .HasColumnName("role_in_company")
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(HR.Domain.Enums.RoleInCompany.RECRUITER)
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
        builder.HasOne(x => x.User)
            .WithOne(u => u.Employer)
            .HasForeignKey<Employer>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Company)
            .WithMany(c => c.Employers)
            .HasForeignKey(x => x.CompanyId)
            .HasConstraintName("fk_employers_companies")
            .OnDelete(DeleteBehavior.SetNull);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
