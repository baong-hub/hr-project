using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.HasKey(x => new { x.UserId, x.RoleId });
        builder.ToTable("user_roles");

        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.RoleId).HasColumnName("role_id");

        builder.HasOne(x => x.User).WithMany(u => u.UserRoles).HasForeignKey(x => x.UserId);
        builder.HasOne(x => x.Role).WithMany(r => r.UserRoles).HasForeignKey(x => x.RoleId);
    }
}

public class UserSiteConfiguration : IEntityTypeConfiguration<UserSite>
{
    public void Configure(EntityTypeBuilder<UserSite> builder)
    {
        builder.ToTable("user_sites");
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.SiteId).HasColumnName("site_id");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.User).WithMany(u => u.UserSites).HasForeignKey(x => x.UserId);
        builder.HasOne(x => x.Site).WithMany(s => s.UserSites).HasForeignKey(x => x.SiteId);
    }
}

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.HasKey(x => new { x.RoleId, x.PermissionId, x.DataScope });
        builder.ToTable("role_permissions");

        builder.Property(x => x.RoleId).HasColumnName("role_id");
        builder.Property(x => x.PermissionId).HasColumnName("permission_id");
        builder.Property(x => x.DataScope).HasColumnName("data_scope");

        builder.HasOne(x => x.Role).WithMany(r => r.RolePermissions).HasForeignKey(x => x.RoleId);
        builder.HasOne(x => x.Permission).WithMany(p => p.RolePermissions).HasForeignKey(x => x.PermissionId);
    }
}

public class UserPermissionConfiguration : IEntityTypeConfiguration<UserPermission>
{
    public void Configure(EntityTypeBuilder<UserPermission> builder)
    {
        builder.HasKey(x => new { x.UserId, x.PermissionId, x.DataScope });
        builder.ToTable("user_permissions");

        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.PermissionId).HasColumnName("permission_id");
        builder.Property(x => x.DataScope).HasColumnName("data_scope");
        builder.Property(x => x.IsCustom).HasColumnName("is_custom");

        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        builder.HasOne(x => x.Permission).WithMany().HasForeignKey(x => x.PermissionId);
    }
}

public class UserDataPermissionConfiguration : IEntityTypeConfiguration<UserDataPermission>
{
    public void Configure(EntityTypeBuilder<UserDataPermission> builder)
    {
        builder.HasKey(x => new { x.UserId, x.TargetUserId });
        builder.ToTable("user_data_permissions");

        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.TargetUserId).HasColumnName("target_user_id");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.CreatedBy).HasColumnName("created_by");

        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.TargetUser).WithMany().HasForeignKey(x => x.TargetUserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class RoleChangeLogConfiguration : IEntityTypeConfiguration<RoleChangeLog>
{
    public void Configure(EntityTypeBuilder<RoleChangeLog> builder)
    {
        builder.ToTable("role_change_logs");
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(x => x.RoleId).HasColumnName("role_id");
        builder.Property(x => x.Username).HasColumnName("username").HasMaxLength(128).IsRequired();
        builder.Property(x => x.Action).HasColumnName("action").HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.Reason).HasColumnName("reason").HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(x => x.Role).WithMany().HasForeignKey(x => x.RoleId);
    }
}

public class EncryptedDataConfiguration : IEntityTypeConfiguration<EncryptedData>
{
    public void Configure(EntityTypeBuilder<EncryptedData> builder)
    {
        builder.ToTable("encrypted_data");
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(x => x.ModuleName).HasColumnName("module_name").HasMaxLength(50).IsRequired();
        builder.Property(x => x.EntityId).HasColumnName("entity_id").IsRequired();
        builder.Property(x => x.FieldName).HasColumnName("field_name").HasMaxLength(50).IsRequired();
        builder.Property(x => x.EncryptedValue).HasColumnName("encrypted_value").IsRequired();
        builder.Property(x => x.ValueHash).HasColumnName("value_hash").HasMaxLength(64);
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");

        builder.HasKey(x => x.Id).HasName("PK_encrypted_data");
        builder.HasIndex(x => new { x.ModuleName, x.EntityId, x.FieldName }).IsUnique();
        builder.HasIndex(x => x.ValueHash).HasDatabaseName("idx_encrypted_data_value_hash");
    }
}







public class InterviewConfiguration : IEntityTypeConfiguration<Interview>
{
    public void Configure(EntityTypeBuilder<Interview> builder)
    {
        builder.ToTable("interviews");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();

        builder.Property(x => x.ApplicationId)
            .HasColumnName("application_id")
            .IsRequired();

        builder.Property(x => x.RoundNumber)
            .HasColumnName("round_number")
            .HasColumnType("int")
            .HasDefaultValue(1)
            .IsRequired();

        builder.Property(x => x.RoundName)
            .HasColumnName("round_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.InterviewerId)
            .HasColumnName("interviewer_id")
            .IsRequired();

        builder.Property(x => x.StartTime)
            .HasColumnName("start_time")
            .HasColumnType("datetime(6)")
            .IsRequired();

        builder.Property(x => x.EndTime)
            .HasColumnName("end_time")
            .HasColumnType("datetime(6)")
            .IsRequired();

        builder.Property(x => x.InterviewType)
            .HasColumnName("interview_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(InterviewType.ONLINE)
            .IsRequired();

        builder.Property(x => x.LocationOrLink)
            .HasColumnName("location_or_link")
            .HasMaxLength(255);

        builder.Property(x => x.Notes)
            .HasColumnName("notes")
            .HasColumnType("text");

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(InterviewStatus.INTERVIEW_INVITATION)
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
        builder.HasOne(x => x.Application)
            .WithMany()
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Interviewer)
            .WithMany()
            .HasForeignKey(x => x.InterviewerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(x => x.DeletedAt == null);

        // Indexes
        builder.HasIndex(x => x.ApplicationId).HasDatabaseName("idx_interviews_application_id");
        builder.HasIndex(x => x.InterviewerId).HasDatabaseName("idx_interviews_interviewer_id");
    }
}
