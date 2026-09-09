using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class JobOfferConfiguration : IEntityTypeConfiguration<JobOffer>
{
    public void Configure(EntityTypeBuilder<JobOffer> builder)
    {
        builder.ToTable("job_offers");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.ApplicationId)
            .HasColumnName("application_id")
            .IsRequired();

        builder.Property(x => x.JobId)
            .HasColumnName("job_id")
            .IsRequired();

        builder.Property(x => x.CandidateId)
            .HasColumnName("candidate_id")
            .IsRequired();

        builder.Property(x => x.CreatedByEmployerId)
            .HasColumnName("created_by_employer_id")
            .IsRequired();

        builder.Property(x => x.PositionTitle)
            .HasColumnName("position_title")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.DepartmentName)
            .HasColumnName("department_name")
            .HasMaxLength(150);

        builder.Property(x => x.WorkLocation)
            .HasColumnName("work_location")
            .HasMaxLength(255);

        builder.Property(x => x.WorkingHours)
            .HasColumnName("working_hours")
            .HasMaxLength(150);

        builder.Property(x => x.BasicSalary)
            .HasColumnName("basic_salary")
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(x => x.Allowance)
            .HasColumnName("allowance")
            .HasColumnType("decimal(18,2)")
            .HasDefaultValue(0);

        builder.Property(x => x.SalaryType)
            .HasColumnName("salary_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.Currency)
            .HasColumnName("currency")
            .HasMaxLength(10)
            .HasDefaultValue("VND")
            .IsRequired();

        builder.Property(x => x.ProbationPeriodMonths)
            .HasColumnName("probation_period_months")
            .HasColumnType("int")
            .HasDefaultValue(2);

        builder.Property(x => x.ProbationSalaryPercentage)
            .HasColumnName("probation_salary_percentage")
            .HasColumnType("decimal(5,2)")
            .HasDefaultValue(85);

        builder.Property(x => x.StartDate)
            .HasColumnName("start_date")
            .IsRequired();

        builder.Property(x => x.ExpiryDate)
            .HasColumnName("expiry_date")
            .IsRequired();

        builder.Property(x => x.IssuedAt)
            .HasColumnName("issued_at")
            .IsRequired();

        builder.Property(x => x.RespondedAt)
            .HasColumnName("responded_at");

        builder.Property(x => x.Benefits)
            .HasColumnName("benefits")
            .HasColumnType("text");

        builder.Property(x => x.SpecialTerms)
            .HasColumnName("special_terms")
            .HasColumnType("text");

        builder.Property(x => x.Notes)
            .HasColumnName("notes")
            .HasColumnType("text");

        builder.Property(x => x.OfferLetterFileUrl)
            .HasColumnName("offer_letter_file_url")
            .HasMaxLength(500);

        builder.Property(x => x.OfferLetterFileName)
            .HasColumnName("offer_letter_file_name")
            .HasMaxLength(255);

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.CandidateResponseNote)
            .HasColumnName("candidate_response_note")
            .HasColumnType("text");

        builder.Property(x => x.CandidateDesiredSalary)
            .HasColumnName("candidate_desired_salary")
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.DeclineReason)
            .HasColumnName("decline_reason")
            .HasMaxLength(500);

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetime(6)")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("datetime(6)")
            .IsRequired();

        // Foreign keys
        builder.HasOne(x => x.Application)
            .WithMany()
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Job)
            .WithMany()
            .HasForeignKey(x => x.JobId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Candidate)
            .WithMany()
            .HasForeignKey(x => x.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CreatedByEmployer)
            .WithMany()
            .HasForeignKey(x => x.CreatedByEmployerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
