using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class InterviewEvaluationConfiguration : IEntityTypeConfiguration<InterviewEvaluation>
{
    public void Configure(EntityTypeBuilder<InterviewEvaluation> builder)
    {
        builder.ToTable("interview_evaluations");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.InterviewId)
            .HasColumnName("interview_id")
            .IsRequired();

        builder.Property(x => x.TechnicalScore)
            .HasColumnName("technical_score")
            .HasColumnType("decimal(3,1)")
            .IsRequired();

        builder.Property(x => x.CommunicationScore)
            .HasColumnName("communication_score")
            .HasColumnType("decimal(3,1)")
            .IsRequired();

        builder.Property(x => x.ProblemSolvingScore)
            .HasColumnName("problem_solving_score")
            .HasColumnType("decimal(3,1)")
            .IsRequired();

        builder.Property(x => x.ExperienceScore)
            .HasColumnName("experience_score")
            .HasColumnType("decimal(3,1)")
            .IsRequired();

        builder.Property(x => x.CultureFitScore)
            .HasColumnName("culture_fit_score")
            .HasColumnType("decimal(3,1)")
            .IsRequired();

        builder.Property(x => x.SalaryExpectationScore)
            .HasColumnName("salary_expectation_score")
            .HasColumnType("decimal(3,1)")
            .IsRequired();

        builder.Property(x => x.OverallScore)
            .HasColumnName("overall_score")
            .HasColumnType("decimal(3,1)")
            .IsRequired();

        builder.Property(x => x.Result)
            .HasColumnName("result")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.Comments)
            .HasColumnName("comments")
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
        builder.HasOne(x => x.Interview)
            .WithMany(i => i.Evaluations)
            .HasForeignKey(x => x.InterviewId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);

        // Indexes
        builder.HasIndex(x => x.InterviewId).HasDatabaseName("idx_interview_evaluations_interview_id");
    }
}
