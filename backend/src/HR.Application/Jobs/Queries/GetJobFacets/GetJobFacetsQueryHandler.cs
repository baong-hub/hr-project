using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Jobs.Common;
using HR.Application.Jobs.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs.Queries.GetJobFacets;

public class GetJobFacetsQueryHandler : IRequestHandler<GetJobFacetsQuery, JobFacetsDto>
{
    private readonly IApplicationDbContext _context;

    public GetJobFacetsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<JobFacetsDto> Handle(GetJobFacetsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var baseQuery = _context.Jobs
            .AsNoTracking()
            .Where(j => j.Status == JobStatus.PUBLISHED);

        // Apply filters requested by client
        baseQuery = JobFilteringHelper.ApplyCommonFilters(
            baseQuery,
            request.Search,
            request.Q,
            request.Provinces,
            request.Province,
            request.City,
            request.Categories,
            request.Category,
            request.Industry,
            request.WorkMode,
            request.Mode,
            request.EmploymentType,
            request.Type,
            request.ExperienceLevel,
            request.Level,
            request.SalaryFrom,
            request.SalaryTo,
            request.Salary,
            request.PostedWithinDays,
            request.Posted,
            request.IsFeatured,
            request.IsUrgent,
            now
        );

        var totalJobs = await baseQuery.CountAsync(cancellationToken);

        // 1. Group by ProvinceCode
        var provinceCounts = await baseQuery
            .Where(j => j.ProvinceCode != null)
            .GroupBy(j => j.ProvinceCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count, cancellationToken);

        // 2. Group by CategoryCode
        var categoryCounts = await baseQuery
            .Where(j => j.CategoryCode != null)
            .GroupBy(j => j.CategoryCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count, cancellationToken);

        // 3. Group by WorkMode
        var workModeCounts = await baseQuery
            .GroupBy(j => j.WorkMode)
            .Select(g => new { Mode = g.Key.ToString().ToLowerInvariant(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Mode, x => x.Count, cancellationToken);

        // 4. Group by EmploymentType
        var typeCounts = await baseQuery
            .Where(j => !string.IsNullOrEmpty(j.EmploymentType))
            .GroupBy(j => j.EmploymentType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Type, x => x.Count, cancellationToken);

        // 5. Group by ExperienceLevel
        var levelCounts = await baseQuery
            .Where(j => !string.IsNullOrEmpty(j.ExperienceLevel))
            .GroupBy(j => j.ExperienceLevel)
            .Select(g => new { Level = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Level, x => x.Count, cancellationToken);

        // 6. Salary Ranges
        var salaryRanges = new Dictionary<string, int>
        {
            ["under_10"] = await baseQuery.CountAsync(j => j.SalaryTo != null && j.SalaryTo <= 10000000, cancellationToken),
            ["10-15"] = await baseQuery.CountAsync(j => (j.SalaryFrom <= 15000000 || j.SalaryFrom == null) && (j.SalaryTo >= 10000000 || j.SalaryTo == null) && (j.SalaryFrom != null || j.SalaryTo != null), cancellationToken),
            ["15-20"] = await baseQuery.CountAsync(j => (j.SalaryFrom <= 20000000 || j.SalaryFrom == null) && (j.SalaryTo >= 15000000 || j.SalaryTo == null) && (j.SalaryFrom != null || j.SalaryTo != null), cancellationToken),
            ["20-30"] = await baseQuery.CountAsync(j => (j.SalaryFrom <= 30000000 || j.SalaryFrom == null) && (j.SalaryTo >= 20000000 || j.SalaryTo == null) && (j.SalaryFrom != null || j.SalaryTo != null), cancellationToken),
            ["30-50"] = await baseQuery.CountAsync(j => (j.SalaryFrom <= 50000000 || j.SalaryFrom == null) && (j.SalaryTo >= 30000000 || j.SalaryTo == null) && (j.SalaryFrom != null || j.SalaryTo != null), cancellationToken),
            ["over_50"] = await baseQuery.CountAsync(j => (j.SalaryFrom >= 50000000 || j.SalaryTo >= 50000000), cancellationToken),
            ["negotiable"] = await baseQuery.CountAsync(j => j.SalaryType == SalaryType.NEGOTIABLE || (j.SalaryFrom == null && j.SalaryTo == null), cancellationToken)
        };

        return new JobFacetsDto(
            totalJobs,
            provinceCounts,
            categoryCounts,
            salaryRanges,
            levelCounts,
            typeCounts,
            workModeCounts
        );
    }
}
