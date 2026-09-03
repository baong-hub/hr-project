using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.Username)
            .HasColumnName("username")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Email)
            .HasColumnName("email")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.PasswordHash)
            .HasColumnName("password_hash")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.PhoneNumber)
            .HasColumnName("phone_number")
            .HasMaxLength(15)
            .IsRequired();

        builder.Property(x => x.Phone)
            .HasColumnName("phone")
            .HasMaxLength(15);

        builder.Property(x => x.FullName)
            .HasColumnName("full_name")
            .HasMaxLength(100);

        builder.Property(x => x.Address)
            .HasColumnName("address")
            .HasMaxLength(255);

        builder.Property(x => x.AccountType)
            .HasColumnName("account_type")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.AvatarUrl)
            .HasColumnName("avatar_url")
            .HasMaxLength(255);

        builder.Property(x => x.SiteId)
            .HasColumnName("site_id")
            .IsRequired();

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(x => x.RoleId)
            .HasColumnName("role_id")
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(HR.Domain.Enums.UserStatus.ACTIVE)
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
        builder.HasOne(x => x.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Site)
            .WithMany()
            .HasForeignKey(x => x.SiteId)
            .OnDelete(DeleteBehavior.Restrict);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);

        // Indexes
        builder.HasIndex(x => x.Email).IsUnique().HasDatabaseName("uq_users_email");
    }
}
