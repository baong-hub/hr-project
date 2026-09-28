using System;
using System.Collections.Generic;
using System.Linq;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Domain.Reference;

namespace HR.Application.Jobs.Common;

public static class JobFilteringHelper
{
    public static List<string> ParseCodes(string? rawInput)
    {
        if (string.IsNullOrWhiteSpace(rawInput)) return new();

        var list = new List<string>();
        var tokens = rawInput.Split(new[] { ',', ';', '|' }, StringSplitOptions.RemoveEmptyEntries);

        foreach (var token in tokens)
        {
            var trimmed = token.Trim();
            if (!string.IsNullOrEmpty(trimmed))
            {
                list.Add(trimmed);
            }
        }

        return list;
    }

    public static List<string> ResolveProvinceCodes(string? provinces, string? province, string? city)
    {
        var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var item in ParseCodes(provinces))
        {
            var code = AdministrativeReference.MatchProvince(item) ?? item.ToLowerInvariant();
            result.Add(code);
        }

        foreach (var item in ParseCodes(province))
        {
            var code = AdministrativeReference.MatchProvince(item) ?? item.ToLowerInvariant();
            result.Add(code);
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            foreach (var item in ParseCodes(city))
            {
                var code = AdministrativeReference.MatchProvince(item) ?? item.ToLowerInvariant();
                result.Add(code);
            }
        }

        return result.ToList();
    }

    public static List<string> ResolveCategoryCodes(string? categories, string? category, string? industry)
    {
        var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var item in ParseCodes(categories))
        {
            var code = AdministrativeReference.MatchCategory(item) ?? item.ToLowerInvariant();
            result.Add(code);
        }

        foreach (var item in ParseCodes(category))
        {
            var code = AdministrativeReference.MatchCategory(item) ?? item.ToLowerInvariant();
            result.Add(code);
        }

        foreach (var item in ParseCodes(industry))
        {
            var code = AdministrativeReference.MatchCategory(item) ?? item.ToLowerInvariant();
            result.Add(code);
        }

        return result.ToList();
    }

    public static int? ParsePostedDays(int? days, string? posted)
    {
        if (days.HasValue && days.Value > 0) return days.Value;
        if (string.IsNullOrWhiteSpace(posted)) return null;

        var clean = posted.Trim().ToLowerInvariant();
        if (clean == "24h" || clean == "1d" || clean == "1") return 1;
        if (clean == "3d" || clean == "3") return 3;
        if (clean == "7d" || clean == "7" || clean == "week") return 7;
        if (clean == "30d" || clean == "30" || clean == "month") return 30;

        if (int.TryParse(clean, out var parsed) && parsed > 0) return parsed;
        return null;
    }

    public static IQueryable<Job> ApplyCommonFilters(
        IQueryable<Job> query,
        string? search,
        string? q,
        string? provinces,
        string? province,
        string? city,
        string? categories,
        string? category,
        string? industry,
        string? workMode,
        string? mode,
        string? employmentType,
        string? type,
        string? experienceLevel,
        string? level,
        decimal? salaryFrom,
        decimal? salaryTo,
        string? salary,
        int? postedWithinDays,
        string? posted,
        bool? isFeatured,
        bool? isUrgent,
        DateTime now
    )
    {
        // 1. Keyword search
        var kw = (search ?? q)?.Trim();
        if (!string.IsNullOrEmpty(kw))
        {
            var lower = kw.ToLower();
            query = query.Where(j =>
                j.Title.ToLower().Contains(lower) ||
                j.Description.ToLower().Contains(lower) ||
                j.Requirements.ToLower().Contains(lower) ||
                (j.Company != null && j.Company.Name.ToLower().Contains(lower))
            );
        }

        // 2. Province filter
        var provinceCodes = ResolveProvinceCodes(provinces, province, city);
        if (provinceCodes.Count > 0)
        {
            query = query.Where(j =>
                (j.ProvinceCode != null && provinceCodes.Contains(j.ProvinceCode)) ||
                (j.ProvinceCode == null && provinceCodes.Any(pc => j.City.ToLower().Contains(pc)))
            );
        }

        // 3. Category / Industry filter
        var categoryCodes = ResolveCategoryCodes(categories, category, industry);
        if (categoryCodes.Count > 0)
        {
            query = query.Where(j =>
                (j.CategoryCode != null && categoryCodes.Contains(j.CategoryCode)) ||
                (j.CategoryCode == null && categoryCodes.Any(cc => j.Category.ToLower().Contains(cc)))
            );
        }

        // 4. WorkMode filter
        var rawMode = (workMode ?? mode)?.Trim();
        if (!string.IsNullOrEmpty(rawMode))
        {
            if (Enum.TryParse<WorkMode>(rawMode, true, out var modeEnum))
            {
                query = query.Where(j => j.WorkMode == modeEnum);
            }
            else if (rawMode.Equals("remote", StringComparison.OrdinalIgnoreCase) || rawMode.Contains("từ xa"))
            {
                query = query.Where(j => j.WorkMode == WorkMode.REMOTE);
            }
            else if (rawMode.Equals("hybrid", StringComparison.OrdinalIgnoreCase) || rawMode.Contains("kết hợp"))
            {
                query = query.Where(j => j.WorkMode == WorkMode.HYBRID);
            }
            else if (rawMode.Equals("onsite", StringComparison.OrdinalIgnoreCase) || rawMode.Contains("văn phòng"))
            {
                query = query.Where(j => j.WorkMode == WorkMode.ONSITE);
            }
        }

        // 5. EmploymentType filter
        var rawType = (employmentType ?? type)?.Trim();
        if (!string.IsNullOrEmpty(rawType))
        {
            query = query.Where(j => j.EmploymentType.ToLower().Contains(rawType.ToLower()));
        }

        // 6. ExperienceLevel filter
        var rawLevel = (experienceLevel ?? level)?.Trim();
        if (!string.IsNullOrEmpty(rawLevel))
        {
            query = query.Where(j => j.ExperienceLevel.ToLower().Contains(rawLevel.ToLower()));
        }

        // 7. Salary filter
        if (salaryFrom.HasValue)
        {
            query = query.Where(j => j.SalaryTo >= salaryFrom.Value || j.SalaryTo == null);
        }

        if (salaryTo.HasValue)
        {
            query = query.Where(j => j.SalaryFrom <= salaryTo.Value || j.SalaryFrom == null);
        }

        if (!string.IsNullOrWhiteSpace(salary))
        {
            var sal = salary.Trim().ToLowerInvariant();
            switch (sal)
            {
                case "under_10":
                case "<10":
                case "duoi-10":
                    query = query.Where(j => j.SalaryTo != null && j.SalaryTo <= 10000000);
                    break;
                case "10-15":
                    query = query.Where(j => (j.SalaryFrom <= 15000000 || j.SalaryFrom == null) && (j.SalaryTo >= 10000000 || j.SalaryTo == null));
                    break;
                case "15-20":
                    query = query.Where(j => (j.SalaryFrom <= 20000000 || j.SalaryFrom == null) && (j.SalaryTo >= 15000000 || j.SalaryTo == null));
                    break;
                case "20-30":
                    query = query.Where(j => (j.SalaryFrom <= 30000000 || j.SalaryFrom == null) && (j.SalaryTo >= 20000000 || j.SalaryTo == null));
                    break;
                case "30-50":
                    query = query.Where(j => (j.SalaryFrom <= 50000000 || j.SalaryFrom == null) && (j.SalaryTo >= 30000000 || j.SalaryTo == null));
                    break;
                case "over_50":
                case ">50":
                case "tren-50":
                    query = query.Where(j => (j.SalaryFrom >= 50000000 || j.SalaryTo >= 50000000));
                    break;
                case "negotiable":
                case "thoa-thuan":
                    query = query.Where(j => j.SalaryType == SalaryType.NEGOTIABLE || (j.SalaryFrom == null && j.SalaryTo == null));
                    break;
            }
        }

        // 8. PostedWithinDays
        var days = ParsePostedDays(postedWithinDays, posted);
        if (days.HasValue)
        {
            var threshold = now.AddDays(-days.Value);
            query = query.Where(j => j.CreatedAt >= threshold);
        }

        // 9. IsFeatured
        if (isFeatured.HasValue && isFeatured.Value)
        {
            query = query.Where(j => j.IsFeatured && (j.FeaturedUntil == null || j.FeaturedUntil > now));
        }

        // 10. IsUrgent
        if (isUrgent.HasValue && isUrgent.Value)
        {
            query = query.Where(j => j.IsUrgent && (j.UrgentUntil == null || j.UrgentUntil > now));
        }

        return query;
    }
}
