using System.Threading.Tasks;
using HR.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HR.IntegrationTests.Common;

public static class TestDatabaseHelper
{
    public static async Task ResetDatabaseAsync(ApplicationDbContext db)
    {
        var sql = @"
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM candidate_follows;
DELETE FROM job_view_logs;
DELETE FROM saved_jobs;
DELETE FROM applications;
DELETE FROM candidate_cvs;
DELETE FROM interviews;
DELETE FROM interview_evaluations;
DELETE FROM technical_tests;
DELETE FROM job_assessment_templates;
DELETE FROM job_offers;
DELETE FROM jobs;
DELETE FROM employers;
DELETE FROM candidates;
DELETE FROM user_roles;
DELETE FROM user_permissions;
DELETE FROM refresh_tokens;
DELETE FROM users;
DELETE FROM sites;
DELETE FROM companies;
DELETE FROM notifications;
SET FOREIGN_KEY_CHECKS = 1;
";
        await db.Database.ExecuteSqlRawAsync(sql);
    }

    public static async Task EnsureCoreDataAsync(ApplicationDbContext db)
    {
        var roleLevel = await db.RoleLevels.FirstOrDefaultAsync();
        if (roleLevel == null)
        {
            roleLevel = new HR.Domain.Entities.RoleLevel { Id = 1, Level = 1, Name = "Standard" };
            db.RoleLevels.Add(roleLevel);
            await db.SaveChangesAsync();
        }

        if (!await db.Roles.AnyAsync(r => r.Id == 1))
        {
            db.Roles.Add(new HR.Domain.Entities.Role { Id = 1, Name = "CANDIDATE", RoleLevelId = roleLevel.Id, Level = 1 });
        }
        if (!await db.Roles.AnyAsync(r => r.Id == 2))
        {
            db.Roles.Add(new HR.Domain.Entities.Role { Id = 2, Name = "EMPLOYER", RoleLevelId = roleLevel.Id, Level = 1 });
        }
        if (!await db.Roles.AnyAsync(r => r.Id == 3))
        {
            db.Roles.Add(new HR.Domain.Entities.Role { Id = 3, Name = "ADMIN", RoleLevelId = roleLevel.Id, Level = 1 });
        }
        await db.SaveChangesAsync();

        if (!await db.Companies.AnyAsync(c => c.Id == 1))
        {
            db.Companies.Add(new HR.Domain.Entities.Company { Id = 1, Code = "C1", Name = "Job Provider", IsVerified = true });
            await db.SaveChangesAsync();
        }

        if (!await db.Sites.AnyAsync(s => s.Id == 1))
        {
            db.Sites.Add(new HR.Domain.Entities.Site { Id = 1, Code = "SITE1", Name = "Default Site", CompanyId = 1 });
            await db.SaveChangesAsync();
        }
    }

    public static HR.Domain.Entities.User CreateTestUser(int id, string username, string email, int roleId = 1, int siteId = 1)
    {
        return new HR.Domain.Entities.User
        {
            Id = id,
            Username = username,
            Email = email,
            PhoneNumber = "0901234567",
            PasswordHash = "hashed_pw",
            RoleId = roleId,
            SiteId = siteId,
            Status = HR.Domain.Enums.UserStatus.ACTIVE,
            AccountType = HR.Domain.Enums.AccountType.User,
            IsActive = true
        };
    }
}
