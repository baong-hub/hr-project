using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HR.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context, 
        Microsoft.Extensions.Configuration.IConfiguration? configuration = null, 
        Microsoft.Extensions.Hosting.IHostEnvironment? environment = null)
    {
        await context.Database.MigrateAsync();
        await SeedCompaniesAsync(context);
        await SeedSitesAsync(context);
        await SeedRoleLevelsAsync(context);
        await SeedRolesAndPermissionsAsync(context);
        await SeedAdminUserAsync(context, configuration, environment);
        await SeedSettingConfigsAsync(context);
        await SeedJobsAsync(context);
        await SeedJobViewLogsAsync(context);
        await SeedMasterDataAsync(context);
        await SeedDepartmentsAsync(context);
        await SeedArticlesAsync(context);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCompaniesAsync(ApplicationDbContext context)
    {
        if (!await context.Companies.AnyAsync())
        {
            context.Companies.Add(new Company
            {
                Id = 1,
                Code = "HR",
                Name = "HỆ THỐNG TÌM VIỆC & TUYỂN DỤNG HR",
                Description = "Cổng thông tin việc làm và quản lý tuyển dụng doanh nghiệp",
                VerificationStatus = CompanyVerificationStatus.VERIFIED,
                IsActive = true
            });
            await context.SaveChangesAsync();
        }

        // Đảm bảo tất cả các doanh nghiệp đã đăng ký đều được bật VERIFIED để ứng viên xem được
        var unverifiedCompanies = await context.Companies
            .Where(c => c.VerificationStatus == CompanyVerificationStatus.DRAFT)
            .ToListAsync();
        if (unverifiedCompanies.Any())
        {
            foreach (var c in unverifiedCompanies)
            {
                c.VerificationStatus = CompanyVerificationStatus.VERIFIED;
            }
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedSitesAsync(ApplicationDbContext context)
    {
        if (await context.Sites.AnyAsync()) return;
        context.Sites.Add(new Site { Code = "HQ", Name = "Trụ sở chính", IsActive = true, CompanyId = 1 });
        await context.SaveChangesAsync();
    }

    private static async Task SeedRoleLevelsAsync(ApplicationDbContext context)
    {
        if (await context.RoleLevels.AnyAsync()) return;

        context.RoleLevels.AddRange(
            new RoleLevel { Level = 0, Name = "Super Admin" },
            new RoleLevel { Level = 1, Name = "Admin quản lý chung" },
            new RoleLevel { Level = 2, Name = "Quản lý doanh nghiệp" },
            new RoleLevel { Level = 5, Name = "Ứng viên / Nhân viên" }
        );
        await context.SaveChangesAsync();
    }

    private static async Task SeedRolesAndPermissionsAsync(ApplicationDbContext context)
    {
        // Define allowed menus and modules for HR Portal
        var allowedMenuCodes = new List<string>
        {
            "menu:jobs", "menu:cvs", "menu:applications", "menu:interviews", "menu:companies", "menu:system",
            "menu:candidate", "menu:notifications", "menu:reports", "menu:messages",
            "menu:talent-pool", "menu:assessments",
            "module:jobs", "module:cvs", "module:applications", "module:interviews", "module:companies",
            "module:saved-jobs", "module:notifications", "module:reports", "module:messages",
            "module:talent-pool", "module:assessments", "module:candidate-offers", "module:candidate-applications",
            "module:system-setting", "module:user", "module:user-role", "module:site",
            "module:master-data", "module:organization"
        };

        // Define allowed permission codes
        var allowedPermissionCodes = new List<string>
        {
            "jobs:view", "jobs:create", "jobs:update", "jobs:delete",
            "cvs:view", "cvs:create", "cvs:update", "cvs:delete", "cv:search",
            "applications:view", "applications:create", "applications:update", "applications:delete",
            "assessment:manage", "assessment:take",
            "offer:view", "offer:manage",
            "interviews:view", "interviews:create", "interviews:update", "interviews:delete",
            "companies:view", "companies:create", "companies:update", "companies:delete",
            "saved-jobs:view", "notifications:view", "reports:view",
            "messages:view", "messages:send",
            "user:view", "user:create", "user:update", "user:delete", "user:reset_password",
            "user-role:view", "user-role:manage", "user-role:assign",
            "site:view", "site:manage",
            "master-data:view", "master-data:create", "master-data:update", "master-data:delete",
            "organization:view", "organization:create", "organization:update", "organization:delete"
        };

        // Clean up old menus, permissions, and role associations from DB
        var rolePermissionsToRemove = await context.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => !allowedPermissionCodes.Contains(rp.Permission.Code))
            .ToListAsync();
        if (rolePermissionsToRemove.Any())
        {
            context.RolePermissions.RemoveRange(rolePermissionsToRemove);
            await context.SaveChangesAsync();
        }

        var permissionsToRemove = await context.Permissions
            .Where(p => !allowedPermissionCodes.Contains(p.Code))
            .ToListAsync();
        if (permissionsToRemove.Any())
        {
            context.Permissions.RemoveRange(permissionsToRemove);
            await context.SaveChangesAsync();
        }

        var menusToRemove = await context.Menus
            .Where(m => !allowedMenuCodes.Contains(m.Code))
            .ToListAsync();
        if (menusToRemove.Any())
        {
            var menuIdsToRemove = menusToRemove.Select(m => m.Id).ToList();
            var dependentChildren = await context.Menus
                .Where(m => m.ParentId.HasValue && menuIdsToRemove.Contains(m.ParentId.Value))
                .ToListAsync();
            foreach (var child in dependentChildren)
            {
                child.ParentId = null;
            }
            if (dependentChildren.Any())
            {
                await context.SaveChangesAsync();
            }

            var childMenus = menusToRemove.Where(m => m.ParentId != null).ToList();
            var parentMenus = menusToRemove.Where(m => m.ParentId == null).ToList();
            if (childMenus.Any())
            {
                context.Menus.RemoveRange(childMenus);
                await context.SaveChangesAsync();
            }
            if (parentMenus.Any())
            {
                context.Menus.RemoveRange(parentMenus);
                await context.SaveChangesAsync();
            }
        }

        // --- 1. MENUS ---
        var topMenus = new List<Menu>
        {
            new() { Code = "menu:jobs", Name = "Quản lý việc làm", ShortName = "Việc làm", SortOrder = 1, Icon = "Briefcase", Route = "/jobs", IsActive = true },
            new() { Code = "menu:talent-pool", Name = "Săn ứng viên (Talent Pool)", ShortName = "Săn ứng viên", SortOrder = 2, Icon = "Users", Route = "/employer/candidates", IsActive = true },
            new() { Code = "menu:cvs", Name = "Hồ sơ & CV", ShortName = "CV", SortOrder = 3, Icon = "FileText", Route = "/cvs", IsActive = true },
            new() { Code = "menu:applications", Name = "Quản lý ứng tuyển", ShortName = "Ứng tuyển", SortOrder = 4, Icon = "Send", Route = "/employer/applications", IsActive = true },
            new() { Code = "menu:assessments", Name = "Đánh giá năng lực", ShortName = "Trắc nghiệm", SortOrder = 5, Icon = "GraduationCap", Route = "/employer/assessments", IsActive = true },
            new() { Code = "menu:candidate", Name = "Khu vực ứng viên", ShortName = "Ứng viên", SortOrder = 6, Icon = "UserCheck", Route = "/candidate/applications", IsActive = true },
            new() { Code = "menu:interviews", Name = "Lịch phỏng vấn", ShortName = "Lịch phỏng vấn", SortOrder = 7, Icon = "Calendar", Route = "/interviews", IsActive = true },
            new() { Code = "menu:companies", Name = "Trang doanh nghiệp", ShortName = "Doanh nghiệp", SortOrder = 8, Icon = "Home", Route = "/companies", IsActive = true },
            new() { Code = "menu:messages", Name = "Tin nhắn & Trò chuyện", ShortName = "Tin nhắn", SortOrder = 9, Icon = "MessageSquare", Route = "/messages", IsActive = true },
            new() { Code = "menu:notifications", Name = "Trung tâm thông báo", ShortName = "Thông báo", SortOrder = 10, Icon = "Bell", Route = "/notifications", IsActive = true },
            new() { Code = "menu:reports", Name = "Báo cáo & Thống kê", ShortName = "Báo cáo", SortOrder = 11, Icon = "BarChart3", Route = "/reports", IsActive = true },
            new() { Code = "menu:system", Name = "Cấu hình hệ thống", ShortName = "Cấu hình", SortOrder = 99, Icon = "Settings", IsActive = true }
        };

        foreach (var m in topMenus)
        {
            var existing = await context.Menus.FirstOrDefaultAsync(x => x.Code == m.Code);
            if (existing == null) context.Menus.Add(m);
            else 
            {
                existing.Name = m.Name; 
                existing.ShortName = m.ShortName;
                existing.SortOrder = m.SortOrder; 
                existing.Icon = m.Icon; 
                existing.Route = m.Route; 
                existing.IsActive = true;
            }
        }
        await context.SaveChangesAsync();

        // --- 2. MODULES ---
        var modules = new List<(string Code, string Name, string ShortName, string ParentCode, int SortOrder, string? Route)>
        {
            ("module:jobs", "Việc làm", "Việc làm", "menu:jobs", 1, "/jobs"),
            ("module:talent-pool", "Săn ứng viên (Talent Pool)", "Săn ứng viên", "menu:talent-pool", 1, "/employer/candidates"),
            ("module:cvs", "Hồ sơ & CV", "CV", "menu:cvs", 1, "/cvs"),
            ("module:applications", "Ứng tuyển", "Ứng tuyển", "menu:applications", 1, "/employer/applications"),
            ("module:assessments", "Đánh giá năng lực", "Trắc nghiệm", "menu:assessments", 1, "/employer/assessments"),
            ("module:candidate-applications", "Lịch sử ứng tuyển", "Ứng tuyển", "menu:candidate", 1, "/candidate/applications"),
            ("module:candidate-offers", "Thư mời nhận việc", "Job Offers", "menu:candidate", 2, "/candidate/offers"),
            ("module:saved-jobs", "Việc làm đã lưu", "Đã lưu", "menu:candidate", 3, "/candidate/saved-jobs"),
            ("module:interviews", "Lịch phỏng vấn", "Lịch phỏng vấn", "menu:interviews", 1, "/interviews"),
            ("module:companies", "Doanh nghiệp", "Doanh nghiệp", "menu:companies", 1, "/companies"),
            ("module:messages", "Tin nhắn", "Tin nhắn", "menu:messages", 1, "/messages"),
            ("module:notifications", "Thông báo", "Thông báo", "menu:notifications", 1, "/notifications"),
            ("module:reports", "Báo cáo & Thống kê", "Báo cáo", "menu:reports", 1, "/reports"),
            ("module:system-setting", "Cấu hình hệ thống", "Cấu hình", "menu:system", 1, "/user-settings/system-configs"),
            ("module:user", "Tài khoản", "Tài khoản", "menu:system", 2, "/users"),
            ("module:user-role", "Phân quyền", "Phân quyền", "menu:system", 3, "/user-roles"),
            ("module:master-data", "Danh mục dùng chung", "Danh mục", "menu:system", 4, "/master-data"),
            ("module:organization", "Cơ cấu tổ chức", "Tổ chức", "menu:system", 5, "/organization"),
            ("module:site", "Chi nhánh", "Chi nhánh", "menu:system", 6, "/sites")
        };

        var allMenusDict = await context.Menus.ToDictionaryAsync(x => x.Code);
        foreach (var mod in modules)
        {
            if (allMenusDict.TryGetValue(mod.ParentCode, out var parent))
            {
                if (!allMenusDict.TryGetValue(mod.Code, out var existing))
                {
                    var newMenu = new Menu { Code = mod.Code, Name = mod.Name, ShortName = mod.ShortName, ParentId = parent.Id, SortOrder = mod.SortOrder, Route = mod.Route, IsActive = true };
                    context.Menus.Add(newMenu);
                    allMenusDict[mod.Code] = newMenu;
                }
                else
                {
                    existing.Name = mod.Name;
                    existing.ShortName = mod.ShortName;
                    existing.ParentId = parent.Id;
                    existing.SortOrder = mod.SortOrder;
                    existing.Route = mod.Route;
                    existing.IsActive = true;
                }
            }
        }
        await context.SaveChangesAsync();

        // --- 3. ACTIONS / PERMISSIONS ---
        var permissionSpecs = new List<(string ModuleCode, string ActionCode, string ActionName)>
        {
            ("module:jobs", "jobs:view", "Xem danh sách việc làm"),
            ("module:jobs", "jobs:create", "Tạo tin tuyển dụng"),
            ("module:jobs", "jobs:update", "Sửa tin tuyển dụng"),
            ("module:jobs", "jobs:delete", "Xóa tin tuyển dụng"),

            ("module:cvs", "cvs:view", "Xem danh sách hồ sơ CV"),
            ("module:cvs", "cvs:create", "Tạo hồ sơ CV"),
            ("module:cvs", "cvs:update", "Cập nhật hồ sơ CV"),
            ("module:cvs", "cvs:delete", "Xóa hồ sơ CV"),

            ("module:applications", "applications:view", "Xem danh sách ứng tuyển"),
            ("module:applications", "applications:create", "Nộp đơn ứng tuyển"),
            ("module:applications", "applications:update", "Cập nhật trạng thái ứng tuyển"),
            ("module:applications", "applications:delete", "Xóa đơn ứng tuyển"),

            ("module:interviews", "interviews:view", "Xem lịch hẹn phỏng vấn"),
            ("module:interviews", "interviews:create", "Lên lịch phỏng vấn"),
            ("module:interviews", "interviews:update", "Cập nhật lịch phỏng vấn"),
            ("module:interviews", "interviews:delete", "Hủy lịch phỏng vấn"),

            ("module:companies", "companies:view", "Xem thông tin doanh nghiệp"),
            ("module:companies", "companies:create", "Đăng ký doanh nghiệp"),
            ("module:companies", "companies:update", "Cập nhật doanh nghiệp"),
            ("module:companies", "companies:delete", "Xóa thông tin doanh nghiệp"),

            ("module:candidate-applications", "applications:view", "Xem lịch sử ứng tuyển"),
            ("module:candidate-applications", "applications:create", "Nộp hồ sơ ứng tuyển"),
            ("module:saved-jobs", "saved-jobs:view", "Xem việc làm đã lưu"),
            ("module:talent-pool", "cv:search", "Tìm kiếm ứng viên Talent Pool"),
            ("module:assessments", "assessment:manage", "Quản lý đề thi trực tuyến"),
            ("module:assessments", "assessment:take", "Làm bài thi trực tuyến"),
            ("module:candidate-offers", "offer:view", "Xem thư mời nhận việc"),
            ("module:candidate-offers", "offer:manage", "Quản lý thư mời nhận việc"),
            ("module:messages", "messages:view", "Xem tin nhắn"),
            ("module:messages", "messages:send", "Gửi tin nhắn"),
            ("module:notifications", "notifications:view", "Xem thông báo"),
            ("module:reports", "reports:view", "Xem báo cáo thống kê"),

            ("module:user", "user:view", "Xem tài khoản"),
            ("module:user", "user:create", "Thêm tài khoản"),
            ("module:user", "user:update", "Sửa tài khoản"),
            ("module:user", "user:delete", "Xóa tài khoản"),
            ("module:user", "user:reset_password", "Đổi mật khẩu tài khoản"),

            ("module:user-role", "user-role:view", "Xem phân quyền"),
            ("module:user-role", "user-role:manage", "Quản lý vai trò"),
            ("module:user-role", "user-role:assign", "Gán vai trò"),

            ("module:site", "site:view", "Xem chi nhánh"),
            ("module:site", "site:manage", "Quản lý chi nhánh"),

            ("module:master-data", "master-data:view", "Xem danh mục dùng chung"),
            ("module:master-data", "master-data:create", "Thêm danh mục"),
            ("module:master-data", "master-data:update", "Sửa danh mục"),
            ("module:master-data", "master-data:delete", "Xóa danh mục"),

            ("module:organization", "organization:view", "Xem cơ cấu tổ chức"),
            ("module:organization", "organization:create", "Thêm phòng ban"),
            ("module:organization", "organization:update", "Sửa phòng ban"),
            ("module:organization", "organization:delete", "Xóa phòng ban")
        };

        allMenusDict = await context.Menus.ToDictionaryAsync(x => x.Code);
        var allPermissionsDict = await context.Permissions.ToDictionaryAsync(x => x.Code);

        foreach (var spec in permissionSpecs)
        {
            if (allMenusDict.TryGetValue(spec.ModuleCode, out var module))
            {
                if (!allPermissionsDict.TryGetValue(spec.ActionCode, out var existing))
                {
                    var newPerm = new Permission { Code = spec.ActionCode, Name = spec.ActionName, MenuId = module.Id, IsActive = true };
                    context.Permissions.Add(newPerm);
                    allPermissionsDict[spec.ActionCode] = newPerm;
                }
                else
                {
                    existing.Name = spec.ActionName;
                    existing.MenuId = module.Id;
                }
            }
        }
        await context.SaveChangesAsync();

        // --- 4. ROLES & SUPER ADMIN ---
        var superAdminLevel = await context.RoleLevels.FirstOrDefaultAsync(l => l.Level == 0);
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Super Admin");
        if (adminRole == null)
        {
            adminRole = new Role 
            { 
                Name = "Super Admin", 
                Description = "Quản trị viên hệ thống tuyển dụng", 
                IsActive = true, 
                Level = 0,
                RoleLevel = superAdminLevel!
            };
            context.Roles.Add(adminRole);
            await context.SaveChangesAsync();
        }

        // Grant all permissions to Super Admin
        var allPermissions = await context.Permissions.ToListAsync();
        var existingRolePerms = await context.RolePermissions
            .Where(rp => rp.RoleId == adminRole.Id)
            .ToListAsync();

        foreach (var perm in allPermissions)
        {
            if (!existingRolePerms.Any(rp => rp.PermissionId == perm.Id))
            {
                context.RolePermissions.Add(new RolePermission 
                { 
                    RoleId = adminRole.Id, 
                    PermissionId = perm.Id, 
                    DataScope = DataScope.ALL 
                });
            }
        }
        await context.SaveChangesAsync();

        // --- 5. SEED CANDIDATE & EMPLOYER ROLES ---
        var candidateLevel = await context.RoleLevels.FirstOrDefaultAsync(l => l.Level == 5);
        var candidateRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Ứng viên");
        if (candidateRole == null)
        {
            candidateRole = new Role
            {
                Name = "Ứng viên",
                Description = "Người đi tìm việc, có quyền quản lý CV và ứng tuyển việc làm",
                IsActive = true,
                Level = 5,
                RoleLevel = candidateLevel!
            };
            context.Roles.Add(candidateRole);
            await context.SaveChangesAsync();
        }

        var candidatePermCodes = new List<string>
        {
            "jobs:view",
            "cvs:view", "cvs:create", "cvs:update", "cvs:delete",
            "applications:view", "applications:create", "applications:delete",
            "assessment:take",
            "offer:view",
            "interviews:view",
            "companies:view",
            "saved-jobs:view",
            "messages:view", "messages:send",
            "notifications:view"
        };
        var dbCandidatePerms = await context.Permissions.Where(p => candidatePermCodes.Contains(p.Code)).ToListAsync();
        var existingCandidatePerms = await context.RolePermissions.Where(rp => rp.RoleId == candidateRole.Id).ToListAsync();
        foreach (var perm in dbCandidatePerms)
        {
            if (!existingCandidatePerms.Any(rp => rp.PermissionId == perm.Id))
            {
                context.RolePermissions.Add(new RolePermission
                {
                    RoleId = candidateRole.Id,
                    PermissionId = perm.Id,
                    DataScope = DataScope.OWN
                });
            }
        }

        var employerLevel = await context.RoleLevels.FirstOrDefaultAsync(l => l.Level == 2);
        var employerRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Nhà tuyển dụng");
        if (employerRole == null)
        {
            employerRole = new Role
            {
                Name = "Nhà tuyển dụng",
                Description = "Đại diện doanh nghiệp, có quyền đăng tin tuyển dụng và quản lý ứng viên",
                IsActive = true,
                Level = 2,
                RoleLevel = employerLevel!
            };
            context.Roles.Add(employerRole);
            await context.SaveChangesAsync();
        }

        var employerPermCodes = new List<string>
        {
            "jobs:view", "jobs:create", "jobs:update", "jobs:delete",
            "cvs:view", "cv:search",
            "applications:view", "applications:update",
            "assessment:manage",
            "offer:manage",
            "interviews:view", "interviews:create", "interviews:update", "interviews:delete",
            "companies:view", "companies:update",
            "messages:view", "messages:send",
            "notifications:view"
        };
        var dbEmployerPerms = await context.Permissions.Where(p => employerPermCodes.Contains(p.Code)).ToListAsync();
        var existingEmployerPerms = await context.RolePermissions.Where(rp => rp.RoleId == employerRole.Id).ToListAsync();
        foreach (var perm in dbEmployerPerms)
        {
            if (!existingEmployerPerms.Any(rp => rp.PermissionId == perm.Id))
            {
                context.RolePermissions.Add(new RolePermission
                {
                    RoleId = employerRole.Id,
                    PermissionId = perm.Id,
                    DataScope = DataScope.SITE
                });
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedAdminUserAsync(
        ApplicationDbContext context,
        Microsoft.Extensions.Configuration.IConfiguration? configuration,
        Microsoft.Extensions.Hosting.IHostEnvironment? environment)
    {
        // Clean up any legacy id=0 user/relations if present in database to avoid EF Core key tracking conflict
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_permissions` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_roles` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_sites` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `users` WHERE `id` = 0;");

        var site = await context.Sites.FirstAsync();
        var adminRole = await context.Roles.FirstAsync(r => r.Name == "Super Admin");
        var candidateRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Ứng viên") ?? adminRole;

        var isProduction = environment != null && string.Equals(environment.EnvironmentName, "Production", StringComparison.OrdinalIgnoreCase);
        var configuredAdminPassword = configuration?["AdminSeed:Password"] 
            ?? configuration?["ADMIN_SEED_PASSWORD"];

        // Ở môi trường Production: chỉ seed admin nếu có biến môi trường ADMIN_SEED_PASSWORD cụ thể
        if (isProduction && string.IsNullOrWhiteSpace(configuredAdminPassword))
        {
            Console.WriteLine("[SECURITY] Môi trường Production phát hiện không có ADMIN_SEED_PASSWORD cấu hình; bỏ qua việc seed tài khoản admin mặc định.");
        }
        else if (!await context.Users.AnyAsync(u => u.Username == "admin"))
        {
            var adminPassword = !string.IsNullOrWhiteSpace(configuredAdminPassword) 
                ? configuredAdminPassword 
                : "Hamo@123";

            var admin = new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                FullName = "Quản trị viên HR",
                Email = "admin@hr.local",
                SiteId = site.Id,
                RoleId = adminRole.Id,
                AccountType = AccountType.Admin,
                IsActive = true
            };
            context.Users.Add(admin);
            await context.SaveChangesAsync();

            context.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id });
            context.UserSites.Add(new UserSite { UserId = admin.Id, SiteId = site.Id });
            await context.SaveChangesAsync();
            Console.WriteLine("[SECURITY] Đã khởi tạo tài khoản quản trị viên Super Admin.");
        }

        // Chỉ seed tài khoản ứng viên test trong môi trường Non-Production (Development/Staging)
        if (!isProduction && !await context.Users.AnyAsync(u => u.Username == "user"))
        {
            var testUser = new User
            {
                Username = "user",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123"),
                FullName = "Ứng viên Test",
                Email = "user@hr.local",
                SiteId = site.Id,
                RoleId = candidateRole.Id,
                AccountType = AccountType.User,
                IsActive = true
            };
            context.Users.Add(testUser);
            await context.SaveChangesAsync();

            context.UserRoles.Add(new UserRole { UserId = testUser.Id, RoleId = candidateRole.Id });
            context.UserSites.Add(new UserSite { UserId = testUser.Id, SiteId = site.Id });
            await context.SaveChangesAsync();
        }

        // Ensure all users have their user_roles populated based on users.role_id
        var usersWithoutRoles = await context.Users
            .Where(u => u.Id > 0 && !context.UserRoles.Any(ur => ur.UserId == u.Id))
            .ToListAsync();
            
        foreach (var u in usersWithoutRoles)
        {
            context.UserRoles.Add(new UserRole { UserId = u.Id, RoleId = u.RoleId });
        }
        await context.SaveChangesAsync();

        // Sync permissions for all users
        await HR.Infrastructure.Security.UserPermissionsHelper.SyncAllUsersPermissionsAsync(context);
    }

    private static async Task SeedSettingConfigsAsync(ApplicationDbContext context)
    {
        var existingKeys = await context.SettingConfigs.Select(s => s.ConfigKey).ToListAsync();

        var configs = new List<SettingConfig>
        {
            new() { ConfigKey = "system.timezone", ConfigValue = "Asia/Ho_Chi_Minh", Group = "System", Description = "Múi giờ mặc định (GMT+7)" },
            new() { ConfigKey = "system.date_format", ConfigValue = "DD/MM/YYYY", Group = "System", Description = "Định dạng ngày mặc định" },
            new() { ConfigKey = "system.datetime_format", ConfigValue = "DD/MM/YYYY HH:mm", Group = "System", Description = "Định dạng ngày giờ mặc định" },
            new() { ConfigKey = "smtp.host", ConfigValue = "smtp.gmail.com", Group = "SMTP", Description = "Máy chủ SMTP gửi mail (Mặc định Gmail: smtp.gmail.com)" },
            new() { ConfigKey = "smtp.port", ConfigValue = "587", Group = "SMTP", Description = "Cổng SMTP (Mặc định TLS: 587 hoặc SSL: 465)" },
            new() { ConfigKey = "smtp.username", ConfigValue = "baong@seryn.vn", Group = "SMTP", Description = "Tài khoản Gmail của công ty dùng để gửi thư" },
            new() { ConfigKey = "smtp.password", ConfigValue = "***REDACTED_APP_PASSWORD***", Group = "SMTP", Description = "Mật khẩu ứng dụng Gmail (Google App Password 16 ký tự)" },
            new() { ConfigKey = "smtp.enable_ssl", ConfigValue = "true", Group = "SMTP", Description = "Bật mã hóa bảo mật SSL/TLS (Bắt buộc cho Gmail)" },
            new() { ConfigKey = "smtp.from_email", ConfigValue = "baong@seryn.vn", Group = "SMTP", Description = "Email người gửi hiển thị (để trống sẽ dùng smtp.username)" },
            new() { ConfigKey = "smtp.from_name", ConfigValue = "Công ty TNHH HaMo Group - Phòng Tuyển Dụng", Group = "SMTP", Description = "Tên hiển thị người gửi khi ứng viên nhận thư" }
        };

        foreach (var c in configs)
        {
            if (!existingKeys.Contains(c.ConfigKey))
            {
                context.SettingConfigs.Add(c);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedJobsAsync(ApplicationDbContext context)
    {
        if (await context.Jobs.AnyAsync()) return;

        var company = await context.Companies.FirstOrDefaultAsync(c => c.Id == 2) 
            ?? await context.Companies.FirstOrDefaultAsync(c => c.Id == 1);
        var employer = await context.Employers.FirstOrDefaultAsync();

        if (company == null || employer == null) return;

        context.Jobs.AddRange(
            new Job
            {
                CompanyId = company.Id,
                EmployerId = employer.Id,
                Title = "Lập trình viên ReactJS (Frontend)",
                Department = "Phát triển phần mềm",
                Category = "IT / Phần mềm",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 15000000,
                SalaryTo = 25000000,
                ExperienceLevel = "1-3 năm kinh nghiệm",
                ExperienceYearsMin = 1,
                Education = "Đại học / Cao đẳng",
                Description = "Chúng tôi đang tìm kiếm Lập trình viên ReactJS năng động để tham gia phát triển các sản phẩm phần mềm nhân sự, quản lý doanh nghiệp chất lượng cao.\n- Xây dựng giao diện Web Responsive, tối ưu hiệu năng.\n- Phối hợp với Backend engineer thiết kế RESTful APIs.",
                Requirements = "- Tối thiểu 1 năm kinh nghiệm làm việc thực tế với ReactJS.\n- Thành thạo HTML5, CSS3 (SCSS/SASS), Javascript (ES6+).\n- Có kiến thức cơ bản về Git và quy trình CI/CD.",
                Benefits = "- Mức lương cạnh tranh theo năng lực.\n- Được hưởng đầy đủ BHXH, BHYT theo quy định.\n- Thưởng lễ tết, lương tháng 13, du lịch hàng năm.",
                ProbationDuration = "2 tháng",
                Openings = 3,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(30)
            },
            new Job
            {
                CompanyId = company.Id,
                EmployerId = employer.Id,
                Title = "Senior .NET Core Backend Engineer",
                Department = "Nền tảng & Hệ thống",
                Category = "IT / Phần mềm",
                EmploymentType = "Full-time",
                City = "TP. HCM",
                WorkMode = WorkMode.HYBRID,
                SalaryType = SalaryType.RANGE,
                SalaryFrom = 30000000,
                SalaryTo = 50000000,
                ExperienceLevel = "Trên 5 năm kinh nghiệm",
                ExperienceYearsMin = 5,
                Education = "Đại học chuyên ngành CNTT",
                Description = "- Thiết kế cấu trúc hệ thống, phát triển các API backend sử dụng ASP.NET Core.\n- Tối ưu hiệu năng truy vấn database MySQL/PostgreSQL, xử lý dữ liệu lớn.\n- Viết Unit/Integration Tests đảm bảo chất lượng code.",
                Requirements = "- Tối thiểu 5 năm kinh nghiệm làm backend .NET Core.\n- Hiểu sâu về Clean Architecture, Design Patterns, OOP.\n- Có kinh nghiệm làm việc với Docker, Kubernetes, Cloud Services là lợi thế.",
                Benefits = "- Lương thưởng hấp dẫn, xét tăng lương 2 lần/năm.\n- Môi trường làm việc năng động, chuyên nghiệp.\n- Gói bảo hiểm sức khỏe cao cấp.",
                ProbationDuration = "2 tháng",
                Openings = 2,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(45)
            },
            new Job
            {
                CompanyId = company.Id,
                EmployerId = employer.Id,
                Title = "Trưởng phòng Tuyển dụng (HR Manager)",
                Department = "Hành chính Nhân sự",
                Category = "Nhân sự / Tuyển dụng",
                EmploymentType = "Full-time",
                City = "Hà Nội",
                WorkMode = WorkMode.ONSITE,
                SalaryType = SalaryType.NEGOTIABLE,
                ExperienceLevel = "Trên 3 năm kinh nghiệm",
                ExperienceYearsMin = 3,
                Education = "Đại học chuyên ngành liên quan",
                Description = "- Quản lý và điều hành toàn bộ hoạt động tuyển dụng của công ty.\n- Xây dựng quy trình tuyển dụng chuyên nghiệp, nâng cao trải nghiệm ứng viên.\n- Phát triển thương hiệu nhà tuyển dụng.",
                Requirements = "- Tối thiểu 3 năm kinh nghiệm ở vị trí tương đương.\n- Kỹ năng giao tiếp, đàm phán và giải quyết vấn đề xuất sắc.\n- Sử dụng thành thạo các kênh tuyển dụng hiện đại.",
                Benefits = "- Lương cứng hấp dẫn kèm thưởng hiệu quả công việc.\n- Cơ hội thăng tiến và phát triển nghề nghiệp lâu dài.\n- Chế độ phúc lợi phong phú.",
                ProbationDuration = "2 tháng",
                Openings = 1,
                Status = JobStatus.PUBLISHED,
                ExpiredAt = DateTime.UtcNow.AddDays(30)
            }
        );
        await context.SaveChangesAsync();
    }

    private static async Task SeedMasterDataAsync(ApplicationDbContext context)
    {
        if (await context.MasterDataCategories.AnyAsync()) return;

        var categories = new List<MasterDataCategory>
        {
            // Ngành nghề
            new() { Type = "Industry", Code = "IT", Name = "Công nghệ thông tin", SortOrder = 1 },
            new() { Type = "Industry", Code = "FINANCE", Name = "Tài chính - Ngân hàng", SortOrder = 2 },
            new() { Type = "Industry", Code = "MARKETING", Name = "Marketing - Truyền thông", SortOrder = 3 },
            new() { Type = "Industry", Code = "HR", Name = "Nhân sự", SortOrder = 4 },
            new() { Type = "Industry", Code = "SALES", Name = "Kinh doanh", SortOrder = 5 },
            new() { Type = "Industry", Code = "EDUCATION", Name = "Giáo dục - Đào tạo", SortOrder = 6 },
            new() { Type = "Industry", Code = "HEALTHCARE", Name = "Y tế - Sức khỏe", SortOrder = 7 },
            new() { Type = "Industry", Code = "CONSTRUCTION", Name = "Xây dựng - Kiến trúc", SortOrder = 8 },

            // Cấp bậc
            new() { Type = "Level", Code = "INTERN", Name = "Thực tập sinh", SortOrder = 1 },
            new() { Type = "Level", Code = "FRESHER", Name = "Fresher", SortOrder = 2 },
            new() { Type = "Level", Code = "JUNIOR", Name = "Junior", SortOrder = 3 },
            new() { Type = "Level", Code = "MIDDLE", Name = "Middle", SortOrder = 4 },
            new() { Type = "Level", Code = "SENIOR", Name = "Senior", SortOrder = 5 },
            new() { Type = "Level", Code = "LEAD", Name = "Team Lead", SortOrder = 6 },
            new() { Type = "Level", Code = "MANAGER", Name = "Manager", SortOrder = 7 },
            new() { Type = "Level", Code = "DIRECTOR", Name = "Director", SortOrder = 8 },

            // Loại hình công việc
            new() { Type = "JobType", Code = "FULLTIME", Name = "Toàn thời gian", SortOrder = 1 },
            new() { Type = "JobType", Code = "PARTTIME", Name = "Bán thời gian", SortOrder = 2 },
            new() { Type = "JobType", Code = "CONTRACT", Name = "Hợp đồng", SortOrder = 3 },
            new() { Type = "JobType", Code = "FREELANCE", Name = "Freelance", SortOrder = 4 },
            new() { Type = "JobType", Code = "INTERNSHIP", Name = "Thực tập", SortOrder = 5 },

            // Hình thức làm việc
            new() { Type = "WorkForm", Code = "ONSITE", Name = "Tại văn phòng", SortOrder = 1 },
            new() { Type = "WorkForm", Code = "REMOTE", Name = "Từ xa", SortOrder = 2 },
            new() { Type = "WorkForm", Code = "HYBRID", Name = "Kết hợp", SortOrder = 3 },

            // Mức lương
            new() { Type = "SalaryRange", Code = "UNDER5M", Name = "Dưới 5 triệu", SortOrder = 1 },
            new() { Type = "SalaryRange", Code = "5M_10M", Name = "5 - 10 triệu", SortOrder = 2 },
            new() { Type = "SalaryRange", Code = "10M_15M", Name = "10 - 15 triệu", SortOrder = 3 },
            new() { Type = "SalaryRange", Code = "15M_20M", Name = "15 - 20 triệu", SortOrder = 4 },
            new() { Type = "SalaryRange", Code = "20M_30M", Name = "20 - 30 triệu", SortOrder = 5 },
            new() { Type = "SalaryRange", Code = "30M_50M", Name = "30 - 50 triệu", SortOrder = 6 },
            new() { Type = "SalaryRange", Code = "ABOVE50M", Name = "Trên 50 triệu", SortOrder = 7 },
            new() { Type = "SalaryRange", Code = "NEGOTIABLE", Name = "Thỏa thuận", SortOrder = 8 },

            // Địa điểm
            new() { Type = "Location", Code = "HN", Name = "Hà Nội", SortOrder = 1 },
            new() { Type = "Location", Code = "HCM", Name = "TP. Hồ Chí Minh", SortOrder = 2 },
            new() { Type = "Location", Code = "DN", Name = "Đà Nẵng", SortOrder = 3 },
            new() { Type = "Location", Code = "HP", Name = "Hải Phòng", SortOrder = 4 },
            new() { Type = "Location", Code = "CT", Name = "Cần Thơ", SortOrder = 5 },
            new() { Type = "Location", Code = "OTHER", Name = "Khác", SortOrder = 99 }
        };

        context.MasterDataCategories.AddRange(categories);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDepartmentsAsync(ApplicationDbContext context)
    {
        if (await context.Departments.AnyAsync()) return;

        var departments = new List<Department>
        {
            new() { Code = "BOD", Name = "Ban Giám đốc", SortOrder = 1 },
            new() { Code = "HR", Name = "Phòng Nhân sự", SortOrder = 2 },
            new() { Code = "IT", Name = "Phòng Công nghệ", SortOrder = 3 },
            new() { Code = "SALES", Name = "Phòng Kinh doanh", SortOrder = 4 },
            new() { Code = "MARKETING", Name = "Phòng Marketing", SortOrder = 5 },
            new() { Code = "FINANCE", Name = "Phòng Tài chính - Kế toán", SortOrder = 6 },
            new() { Code = "ADMIN", Name = "Phòng Hành chính", SortOrder = 7 }
        };

        context.Departments.AddRange(departments);
        await context.SaveChangesAsync();
    }

    private static async Task SeedJobViewLogsAsync(ApplicationDbContext context)
    {
        if (await context.JobViewLogs.AnyAsync()) return;

        var jobs = await context.Jobs.Where(j => j.DeletedAt == null).ToListAsync();
        if (!jobs.Any()) return;

        var random = new Random(42);
        var logs = new List<JobViewLog>();

        foreach (var job in jobs)
        {
            var viewCount = random.Next(28, 65);
            for (int i = 0; i < viewCount; i++)
            {
                var daysAgo = random.Next(0, 28);
                logs.Add(new JobViewLog
                {
                    JobId = job.Id,
                    IpAddress = $"192.168.1.{random.Next(10, 200)}",
                    UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
                    ViewedAt = DateTime.Now.AddDays(-daysAgo).AddMinutes(random.Next(0, 1440))
                });
            }
        }

        context.JobViewLogs.AddRange(logs);
        await context.SaveChangesAsync();
    }

    private static async Task SeedArticlesAsync(ApplicationDbContext context)
    {
        if (await context.Articles.AnyAsync()) return;

        var articles = new List<Article>
        {
            new()
            {
                Title = "Bí quyết viết CV chuẩn ATS chinh phục mọi nhà tuyển dụng năm 2026",
                Slug = "bi-quyet-viet-cv-chuan-ats-chinh-phuc-nha-tuyen-dung-2026",
                Summary = "Tìm hiểu hệ thống theo dõi ứng viên (ATS) hoạt động như thế nào, cách chọn từ khoá và định dạng CV giúp bạn vượt qua 95% vòng quét tự động.",
                Category = "Bí quyết viết CV",
                Tags = "CV, ATS, Tìm việc, Kinh nghiệm ứng tuyển, Tuyển dụng",
                AuthorName = "Chuyên gia Tuyển dụng HR",
                ThumbnailUrl = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80",
                ReadingTimeMinutes = 6,
                ViewCount = 1420,
                IsPublished = true,
                PublishedAt = DateTime.UtcNow.AddDays(-15),
                SeoTitle = "Bí quyết viết CV chuẩn ATS 2026 - Tăng 300% cơ hội gọi phỏng vấn",
                SeoDescription = "Hướng dẫn chi tiết cách viết CV chuẩn ATS: bố cục, từ khoá, định dạng file giúp CV của bạn lọt mắt xanh nhà tuyển dụng và hệ thống lọc hồ sơ tự động.",
                SeoKeywords = "viết cv, cv chuẩn ats, mẫu cv đẹp, kinh nghiệm xin việc 2026",
                ContentHtml = @"
                    <h2>1. Hệ thống ATS (Applicant Tracking System) là gì?</h2>
                    <p>ATS là phần mềm quản lý hồ sơ ứng viên được hơn 90% doanh nghiệp lớn và công ty công nghệ sử dụng để tự động phân loại, trích xuất dữ liệu và chấm điểm CV trước khi chuyển tới tay HR.</p>
                    <h2>2. Các lỗi phổ biến khiến CV bị ATS đánh rớt ngay lập tức</h2>
                    <ul>
                        <li><strong>Dùng biểu bảng (Tables) hoặc đồ hoạ phức tạp:</strong> Các bot ATS thường không đọc được chữ nằm trong table hoặc ảnh.</li>
                        <li><strong>Thiếu từ khoá (Keywords) từ Job Description:</strong> Nếu JD yêu cầu 'React, TypeScript, Agile' mà CV chỉ ghi 'Frontend Developer chung chung', điểm khớp lệnh sẽ rất thấp.</li>
                        <li><strong>Tên tiêu đề mục không chuẩn:</strong> Nên dùng các tiêu đề chuẩn như 'Kinh nghiệm làm việc', 'Kỹ năng chuyên môn', 'Học vấn' thay vì từ ngữ cách điệu.</li>
                    </ul>
                    <h2>3. Chiến lược tối ưu CV 1 trang hiệu quả</h2>
                    <p>Hãy áp dụng công thức <strong>STAR (Situation - Task - Action - Result)</strong> hoặc mô hình <em>X-Y-Z của Google</em>: 'Đạt được thành tích X, đo lường bằng con số Y, thông qua hành động Z'.</p>
                    <p>Đừng quên tải CV định dạng PDF hoặc DOCX với dung lượng dưới 5MB để đảm bảo hệ thống đọc mượt mà nhất.</p>
                "
            },
            new()
            {
                Title = "Top 10 câu hỏi phỏng vấn Frontend & React Developer phổ biến nhất",
                Slug = "top-10-cau-hoi-phong-van-frontend-react-developer",
                Summary = "Tổng hợp các câu hỏi phỏng vấn kỹ thuật React, Javascript ES6+, tối ưu hiệu năng và cách trả lời tạo ấn tượng mạnh với Tech Lead.",
                Category = "Kinh nghiệm phỏng vấn",
                Tags = "React, Frontend, Phỏng vấn IT, JavaScript, Web Development",
                AuthorName = "Tech Advisory Board",
                ThumbnailUrl = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
                ReadingTimeMinutes = 8,
                ViewCount = 2850,
                IsPublished = true,
                PublishedAt = DateTime.UtcNow.AddDays(-10),
                SeoTitle = "10 câu hỏi phỏng vấn ReactJS hay gặp nhất và cách trả lời chuẩn",
                SeoDescription = "Trọn bộ câu hỏi phỏng vấn ReactJS từ cơ bản đến nâng cao: Virtual DOM, useEffect, Custom Hooks, Redux Toolkit, SSR kèm giải thích trực quan.",
                SeoKeywords = "phỏng vấn reactjs, câu hỏi phỏng vấn frontend, react interview questions",
                ContentHtml = @"
                    <h2>1. Virtual DOM hoạt động như thế nào và Diffing Algorithm là gì?</h2>
                    <p>React duy trì một cây DOM ảo trong bộ nhớ. Khi state thay đổi, React so sánh snapshot mới với snapshot cũ (quá trình Reconciliation) và chỉ cập nhật những node thực sự thay đổi trên Real DOM.</p>
                    <h2>2. Khi nào nên dùng useMemo và useCallback?</h2>
                    <p>Tránh lạm dụng! Chỉ nên dùng khi việc tính toán (computation) tốn kém hoặc khi truyền function/object làm prop cho một memoized child component (<code>React.memo</code>) để tránh re-render không cần thiết.</p>
                    <h2>3. Quản lý State: Khi nào dùng Context API vs Redux/Zustand?</h2>
                    <p>Context API tuyệt vời cho các state ít thay đổi nhưng dùng toàn cục (Theme, Ngôn ngữ, Auth User). Với các luồng dữ liệu nghiệp vụ phức tạp, tần suất cập nhật cao, Zustand hoặc Redux Toolkit mang lại hiệu năng cao hơn nhờ selective subscription.</p>
                    <h2>4. Bí quyết thể hiện tư duy kiến trúc trong buổi phỏng vấn</h2>
                    <p>Khi được hỏi, hãy giải thích cả <em>Ưu điểm</em>, <em>Nhược điểm</em> và <em>Tình huống thực tế</em> bạn đã xử lý thành công thay vì chỉ đọc thuộc định nghĩa lý thuyết.</p>
                "
            },
            new()
            {
                Title = "Quy định về thời gian và mức lương thử việc theo Bộ luật Lao động mới nhất",
                Slug = "quy-dinh-thoi-gian-va-luong-thu-viec-theo-luat-lao-dong",
                Summary = "Người lao động cần nắm rõ: Thử việc tối đa bao nhiêu tháng? Lương thử việc tối thiểu bằng bao nhiêu % lương chính thức và quyền huỷ bỏ hợp đồng thử việc.",
                Category = "Pháp luật lao động",
                Tags = "Luật lao động, Lương thử việc, Quyền lợi ứng viên, Hợp đồng lao động",
                AuthorName = "Ban Pháp chế & Nhân sự",
                ThumbnailUrl = "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
                ReadingTimeMinutes = 5,
                ViewCount = 3120,
                IsPublished = true,
                PublishedAt = DateTime.UtcNow.AddDays(-5),
                SeoTitle = "Quy định thời gian và mức lương thử việc 2026 - Người lao động cần biết",
                SeoDescription = "Bộ luật Lao động quy định chi tiết về thời gian thử việc từng vị trí, mức lương tối thiểu 85% và quyền đơn phương chấm dứt thử việc không cần báo trước.",
                SeoKeywords = "lương thử việc, thời gian thử việc, luật lao động thử việc, quyền lợi người lao động",
                ContentHtml = @"
                    <h2>1. Thời gian thử việc tối đa là bao lâu?</h2>
                    <p>Theo Điều 25 Bộ luật Lao động, thời gian thử việc do hai bên thoả thuận nhưng chỉ được thử việc 01 lần đối với một công việc và bảo đảm điều kiện sau:</p>
                    <ul>
                        <li><strong>Không quá 180 ngày:</strong> Đối với công việc của người quản lý doanh nghiệp.</li>
                        <li><strong>Không quá 60 ngày:</strong> Đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn, kỹ thuật từ cao đẳng trở lên.</li>
                        <li><strong>Không quá 30 ngày:</strong> Đối với công việc có chức danh nghề nghiệp cần trình độ trung cấp, công nhân kỹ thuật.</li>
                        <li><strong>Không quá 06 ngày làm việc:</strong> Đối với công việc khác.</li>
                    </ul>
                    <h2>2. Tiền lương trong thời gian thử việc</h2>
                    <p>Tiền lương của người lao động trong thời gian thử việc do hai bên thoả thuận nhưng <strong>ít nhất phải bằng 85%</strong> mức lương của công việc đó.</p>
                    <h2>3. Kết thúc thời gian thử việc</h2>
                    <p>Khi kết thúc thời gian thử việc, người sử dụng lao động phải thông báo kết quả. Nếu đạt yêu cầu, doanh nghiệp phải tiếp tục giao kết hợp đồng lao động chính thức.</p>
                "
            }
        };

        context.Articles.AddRange(articles);
        await context.SaveChangesAsync();
    }
}
