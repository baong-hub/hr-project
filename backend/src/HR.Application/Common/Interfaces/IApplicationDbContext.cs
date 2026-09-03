using Microsoft.EntityFrameworkCore;
using HR.Domain.Entities;

namespace HR.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserSite> UserSites { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<UserPermission> UserPermissions { get; }
    DbSet<UserDataPermission> UserDataPermissions { get; }
    DbSet<RoleChangeLog> RoleChangeLogs { get; }
    DbSet<UserSetting> UserSettings { get; }
    DbSet<Menu> Menus { get; }
    DbSet<RoleLevel> RoleLevels { get; }
    DbSet<Site> Sites { get; }
    DbSet<Company> Companies { get; }
    DbSet<LogActivity> LogActivities { get; }
    DbSet<UserSession> UserSessions { get; }
    DbSet<SettingConfig> SettingConfigs { get; }
    DbSet<EncryptedData> EncryptedData { get; }
    DbSet<UserColumnSetting> UserColumnSettings { get; }
    DbSet<UserPresenceLog> UserPresenceLogs { get; }

    // HR Core DbSets
    DbSet<Employer> Employers { get; }
    DbSet<Candidate> Candidates { get; }
    DbSet<Job> Jobs { get; }
    DbSet<CandidateCv> CandidateCvs { get; }
    DbSet<HR.Domain.Entities.Application> Applications { get; }
    DbSet<Interview> Interviews { get; }
    DbSet<InterviewEvaluation> InterviewEvaluations { get; }
    DbSet<TechnicalTest> TechnicalTests { get; }
    DbSet<SavedJob> SavedJobs { get; }
    DbSet<CandidateFollow> CandidateFollows { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<JobViewLog> JobViewLogs { get; }
    DbSet<ViolationReport> ViolationReports { get; }
    DbSet<RecruitmentCampaign> RecruitmentCampaigns { get; }
    DbSet<CompanySubscription> CompanySubscriptions { get; }
    DbSet<CandidateEducation> CandidateEducations { get; }
    DbSet<CandidateExperience> CandidateExperiences { get; }
    DbSet<CandidateProject> CandidateProjects { get; }
    DbSet<CandidateCertificate> CandidateCertificates { get; }
    DbSet<Skill> Skills { get; }
    DbSet<CandidateSkill> CandidateSkills { get; }

    Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
