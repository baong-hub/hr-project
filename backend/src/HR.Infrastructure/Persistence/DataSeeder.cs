using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HR.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await context.Database.MigrateAsync();
        await SeedCompaniesAsync(context);
        await SeedSitesAsync(context);
        await SeedRoleLevelsAsync(context);
        await SeedRolesAndPermissionsAsync(context);
        await SeedAdminUserAsync(context);
        await SeedSettingConfigsAsync(context);
        await SeedJobsAsync(context);
        await SeedMasterDataAsync(context);
        await SeedDepartmentsAsync(context);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCompaniesAsync(ApplicationDbContext context)
    {
        if (await context.Companies.AnyAsync()) return;
        
        context.Companies.Add(new Company
        {
            Id = 1,
            Code = "HR",
            Name = "HỆ THỐNG TÌM VIỆC & TUYỂN DỤNG HR",
            Description = "Cổng thông tin việc làm và quản lý tuyển dụng doanh nghiệp",
            IsActive = true
        });
        await context.SaveChangesAsync();
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
            "menu:saved-jobs", "menu:notifications", "menu:reports", "menu:messages",
            "module:jobs", "module:cvs", "module:applications", "module:interviews", "module:companies",
            "module:saved-jobs", "module:notifications", "module:reports", "module:messages",
            "module:system-setting", "module:user", "module:user-role", "module:site",
            "module:master-data", "module:organization"
        };

        // Define allowed permission codes
        var allowedPermissionCodes = new List<string>
        {
            "jobs:view", "jobs:create", "jobs:update", "jobs:delete",
            "cvs:view", "cvs:create", "cvs:update", "cvs:delete",
            "applications:view", "applications:create", "applications:update", "applications:delete",
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
            context.Menus.RemoveRange(menusToRemove);
            await context.SaveChangesAsync();
        }

        // --- 1. MENUS ---
        var topMenus = new List<Menu>
        {
            new() { Code = "menu:jobs", Name = "Quản lý việc làm", ShortName = "Việc làm", SortOrder = 1, Icon = "Briefcase", Route = "/jobs", IsActive = true },
            new() { Code = "menu:cvs", Name = "Hồ sơ & CV", ShortName = "CV", SortOrder = 2, Icon = "FileText", Route = "/cvs", IsActive = true },
            new() { Code = "menu:applications", Name = "Quản lý ứng tuyển", ShortName = "Ứng tuyển", SortOrder = 3, Icon = "Send", Route = "/applications", IsActive = true },
            new() { Code = "menu:interviews", Name = "Lịch phỏng vấn", ShortName = "Lịch phỏng vấn", SortOrder = 4, Icon = "Calendar", Route = "/interviews", IsActive = true },
            new() { Code = "menu:companies", Name = "Trang doanh nghiệp", ShortName = "Doanh nghiệp", SortOrder = 5, Icon = "Home", Route = "/companies", IsActive = true },
            new() { Code = "menu:saved-jobs", Name = "Việc làm đã lưu", ShortName = "Đã lưu", SortOrder = 6, Icon = "Heart", Route = "/saved-jobs", IsActive = true },
            new() { Code = "menu:messages", Name = "Tin nhắn & Trò chuyện", ShortName = "Tin nhắn", SortOrder = 7, Icon = "MessageSquare", Route = "/messages", IsActive = true },
            new() { Code = "menu:notifications", Name = "Trung tâm thông báo", ShortName = "Thông báo", SortOrder = 8, Icon = "Bell", Route = "/notifications", IsActive = true },
            new() { Code = "menu:reports", Name = "Báo cáo & Thống kê", ShortName = "Báo cáo", SortOrder = 9, Icon = "BarChart3", Route = "/reports", IsActive = true },
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
            ("module:cvs", "Hồ sơ & CV", "CV", "menu:cvs", 1, "/cvs"),
            ("module:applications", "Ứng tuyển", "Ứng tuyển", "menu:applications", 1, "/applications"),
            ("module:interviews", "Lịch phỏng vấn", "Lịch phỏng vấn", "menu:interviews", 1, "/interviews"),
            ("module:companies", "Doanh nghiệp", "Doanh nghiệp", "menu:companies", 1, "/companies"),
            ("module:saved-jobs", "Việc làm đã lưu", "Đã lưu", "menu:saved-jobs", 1, "/saved-jobs"),
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

            ("module:saved-jobs", "saved-jobs:view", "Xem việc làm đã lưu"),
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
            "cvs:view",
            "applications:view", "applications:update",
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

    private static async Task SeedAdminUserAsync(ApplicationDbContext context)
    {
        // Clean up any legacy id=0 user/relations if present in database to avoid EF Core key tracking conflict
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_permissions` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_roles` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `user_sites` WHERE `user_id` = 0;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM `users` WHERE `id` = 0;");

        var site = await context.Sites.FirstAsync();
        var adminRole = await context.Roles.FirstAsync(r => r.Name == "Super Admin");
        var candidateRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Ứng viên") ?? adminRole;

        if (!await context.Users.AnyAsync(u => u.Username == "admin"))
        {
            var admin = new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Hamo@123"),
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
        }

        if (!await context.Users.AnyAsync(u => u.Username == "user"))
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
            new() { ConfigKey = "system.datetime_format", ConfigValue = "DD/MM/YYYY HH:mm", Group = "System", Description = "Định dạng ngày giờ mặc định" }
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
}
