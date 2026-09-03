using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using System.Text;

namespace HR.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options), IApplicationDbContext
{
    // Identity
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<UserSite> UserSites => Set<UserSite>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<UserDataPermission> UserDataPermissions => Set<UserDataPermission>();
    public DbSet<RoleChangeLog> RoleChangeLogs => Set<RoleChangeLog>();
    public DbSet<UserSetting> UserSettings => Set<UserSetting>();
    public DbSet<UserColumnSetting> UserColumnSettings => Set<UserColumnSetting>();
    public DbSet<UserPresenceLog> UserPresenceLogs => Set<UserPresenceLog>();
    public DbSet<Menu> Menus => Set<Menu>();
    public DbSet<RoleLevel> RoleLevels => Set<RoleLevel>();

    // Core
    public DbSet<Site> Sites => Set<Site>();
    
    // Master Data
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Employer> Employers => Set<Employer>();
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<CandidateCv> CandidateCvs => Set<CandidateCv>();
    public DbSet<HR.Domain.Entities.Application> Applications => Set<HR.Domain.Entities.Application>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<InterviewEvaluation> InterviewEvaluations => Set<InterviewEvaluation>();
    public DbSet<TechnicalTest> TechnicalTests => Set<TechnicalTest>();
    public DbSet<SavedJob> SavedJobs => Set<SavedJob>();
    public DbSet<CandidateFollow> CandidateFollows => Set<CandidateFollow>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<JobViewLog> JobViewLogs => Set<JobViewLog>();
    public DbSet<ViolationReport> ViolationReports => Set<ViolationReport>();
    public DbSet<RecruitmentCampaign> RecruitmentCampaigns => Set<RecruitmentCampaign>();
    public DbSet<CompanySubscription> CompanySubscriptions => Set<CompanySubscription>();
    public DbSet<CandidateEducation> CandidateEducations => Set<CandidateEducation>();
    public DbSet<CandidateExperience> CandidateExperiences => Set<CandidateExperience>();
    public DbSet<CandidateProject> CandidateProjects => Set<CandidateProject>();
    public DbSet<CandidateCertificate> CandidateCertificates => Set<CandidateCertificate>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<CandidateSkill> CandidateSkills => Set<CandidateSkill>();

    public DbSet<LogActivity> LogActivities => Set<LogActivity>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<EncryptedData> EncryptedData => Set<EncryptedData>();
    public DbSet<SettingConfig> SettingConfigs => Set<SettingConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        ApplySnakeCaseNamingConvention(modelBuilder);
    }

    private void ApplySnakeCaseNamingConvention(ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            foreach (var property in entity.GetProperties())
            {
                var storeObjectIdentifier = StoreObjectIdentifier.Table(entity.GetTableName()!, entity.GetSchema());
                var columnName = property.GetColumnName(storeObjectIdentifier);
                if (!string.IsNullOrEmpty(columnName))
                {
                    property.SetColumnName(ToSnakeCase(columnName));
                }
            }

            foreach (var key in entity.GetKeys())
            {
                var keyName = key.GetName();
                if (!string.IsNullOrEmpty(keyName))
                {
                    key.SetName(ToSnakeCase(keyName));
                }
            }

            foreach (var key in entity.GetForeignKeys())
            {
                var constraintName = key.GetConstraintName();
                if (!string.IsNullOrEmpty(constraintName))
                {
                    key.SetConstraintName(ToSnakeCase(constraintName));
                }
            }

            foreach (var index in entity.GetIndexes())
            {
                var indexName = index.GetDatabaseName();
                if (!string.IsNullOrEmpty(indexName))
                {
                    index.SetDatabaseName(ToSnakeCase(indexName));
                }
            }
        }
    }

    private static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;

        var result = new StringBuilder();
        for (int i = 0; i < input.Length; i++)
        {
            var c = input[i];
            if (char.IsUpper(c))
            {
                if (i > 0 && !char.IsUpper(input[i - 1]) && input[i - 1] != '_')
                {
                    result.Append('_');
                }
                result.Append(char.ToLower(c));
            }
            else
            {
                result.Append(c);
            }
        }
        return result.ToString();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is BaseEntity baseEntity)
            {
                if (entry.State == EntityState.Added)
                {
                    if (baseEntity.CreatedAt == default) baseEntity.CreatedAt = DateTime.Now;
                    baseEntity.UpdatedAt = DateTime.Now;
                }
                else if (entry.State == EntityState.Modified)
                {
                    baseEntity.UpdatedAt = DateTime.Now;
                }
            }

            if (entry.State == EntityState.Added)
            {
                var isActiveProp = entry.Metadata.FindProperty("IsActive");
                if (isActiveProp != null && isActiveProp.ClrType == typeof(bool))
                {
                    entry.Property("IsActive").CurrentValue = true;
                }
            }
        }
        
        try
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        catch (Exception)
        {
            foreach (var entry in ChangeTracker.Entries().Where(e => e.State == EntityState.Added))
            {
                var props = string.Join(", ", entry.CurrentValues.Properties.Select(p => $"{p.Name}={entry.CurrentValues[p]}"));
                Console.WriteLine($"FAILED ENTITY: {entry.Entity.GetType().Name} - {props}");
            }
            throw;
        }
    }
}
