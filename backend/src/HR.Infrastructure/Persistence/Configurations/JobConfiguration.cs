using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class JobConfiguration : IEntityTypeConfiguration<Job>
{
    public void Configure(EntityTypeBuilder<Job> builder)
    {
        builder.ToTable("jobs");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.CompanyId).HasColumnName("company_id").IsRequired();
        builder.Property(x => x.EmployerId).HasColumnName("employer_id").IsRequired();

        builder.Property(x => x.Title)
            .HasColumnName("title")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Department)
            .HasColumnName("department")
            .HasMaxLength(100);

        builder.Property(x => x.Category)
            .HasColumnName("category")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.EmploymentType)
            .HasColumnName("employment_type")
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Country)
            .HasColumnName("country")
            .HasMaxLength(50)
            .HasDefaultValue("VIETNAM")
            .IsRequired();

        builder.Property(x => x.City)
            .HasColumnName("city")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.District)
            .HasColumnName("district")
            .HasMaxLength(50);

        builder.Property(x => x.Office)
            .HasColumnName("office")
            .HasMaxLength(200);

        builder.Property(x => x.WorkMode)
            .HasColumnName("work_mode")
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(WorkMode.ONSITE)
            .IsRequired();

        builder.Property(x => x.SalaryType)
            .HasColumnName("salary_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(SalaryType.NEGOTIABLE)
            .IsRequired();

        builder.Property(x => x.SalaryFrom)
            .HasColumnName("salary_from")
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.SalaryTo)
            .HasColumnName("salary_to")
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.ExperienceLevel)
            .HasColumnName("experience_level")
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.ExperienceYearsMin)
            .HasColumnName("experience_years_min");

        builder.Property(x => x.Education)
            .HasColumnName("education")
            .HasMaxLength(100);

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(x => x.Requirements)
            .HasColumnName("requirements")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(x => x.Benefits)
            .HasColumnName("benefits")
            .HasColumnType("text");

        builder.Property(x => x.ProbationDuration)
            .HasColumnName("probation_duration")
            .HasMaxLength(50);

        builder.Property(x => x.Openings)
            .HasColumnName("openings")
            .HasDefaultValue(1)
            .IsRequired();

        builder.Property(x => x.HiredCount)
            .HasColumnName("hired_count")
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(JobStatus.DRAFT)
            .IsRequired();

        builder.Property(x => x.ExpiredAt)
            .HasColumnName("expired_at")
            .HasColumnType("date")
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
        builder.HasOne(x => x.Company)
            .WithMany(c => c.Jobs)
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Employer)
            .WithMany()
            .HasForeignKey(x => x.EmployerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);

        // Indexes
        builder.HasIndex(x => new { x.Status, x.ExpiredAt }).HasDatabaseName("idx_jobs_status_expired");
        builder.HasIndex(x => x.EmployerId).HasDatabaseName("idx_jobs_employer");
    }
}
