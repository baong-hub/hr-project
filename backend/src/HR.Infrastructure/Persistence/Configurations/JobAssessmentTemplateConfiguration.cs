using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class JobAssessmentTemplateConfiguration : IEntityTypeConfiguration<JobAssessmentTemplate>
{
    public void Configure(EntityTypeBuilder<JobAssessmentTemplate> builder)
    {
        builder.ToTable("job_assessment_templates");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.JobId)
            .HasColumnName("job_id")
            .IsRequired();

        builder.Property(x => x.Title)
            .HasColumnName("title")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasColumnType("text");

        builder.Property(x => x.TestType)
            .HasColumnName("test_type")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.DurationMinutes)
            .HasColumnName("duration_minutes")
            .HasColumnType("int")
            .HasDefaultValue(30)
            .IsRequired();

        builder.Property(x => x.PassingScore)
            .HasColumnName("passing_score")
            .HasColumnType("int")
            .HasDefaultValue(70)
            .IsRequired();

        builder.Property(x => x.TotalQuestions)
            .HasColumnName("total_questions")
            .HasColumnType("int")
            .HasDefaultValue(10)
            .IsRequired();

        builder.Property(x => x.QuestionsData)
            .HasColumnName("questions_data")
            .HasColumnType("longtext")
            .IsRequired();

        builder.Property(x => x.AutoInviteOnApply)
            .HasColumnName("auto_invite_on_apply")
            .HasColumnType("tinyint(1)")
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(x => x.AutoInviteOnScreening)
            .HasColumnName("auto_invite_on_screening")
            .HasColumnType("tinyint(1)")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .HasColumnType("tinyint(1)")
            .HasDefaultValue(true)
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
        builder.HasOne(x => x.Job)
            .WithMany()
            .HasForeignKey(x => x.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);

        // Indexes
        builder.HasIndex(x => x.JobId).HasDatabaseName("idx_job_assessment_templates_job_id");
    }
}
