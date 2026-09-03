using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class CandidateCertificateConfiguration : IEntityTypeConfiguration<CandidateCertificate>
{
    public void Configure(EntityTypeBuilder<CandidateCertificate> builder)
    {
        builder.ToTable("candidate_certificates");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId)
            .HasColumnName("candidate_id")
            .IsRequired();

        builder.Property(x => x.CertificateName)
            .HasColumnName("certificate_name")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.IssuedBy)
            .HasColumnName("issued_by")
            .HasMaxLength(150);

        builder.Property(x => x.IssuedDate)
            .HasColumnName("issued_date")
            .HasColumnType("date");

        builder.Property(x => x.ExpirationDate)
            .HasColumnName("expiration_date")
            .HasColumnType("date");

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
        builder.HasOne(x => x.Candidate)
            .WithMany(c => c.Certificates)
            .HasForeignKey(x => x.CandidateId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_candidate_certificates_candidates");

        // Soft delete query filter
        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
