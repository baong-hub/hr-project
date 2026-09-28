using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Jobs.Common;
using HR.Application.Jobs.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs.Queries.GetJobs;

public class GetJobsQueryHandler : IRequestHandler<GetJobsQuery, PagedResult<JobDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetJobsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<JobDto>> Handle(GetJobsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Jobs
            .Include(j => j.Company)
            .Include(j => j.Employer)
            .AsNoTracking();

        var userId = _currentUserService.UserId;
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        var roles = user?.UserRoles.Select(ur => ur.Role.Name).ToList() ?? [];
        var isSuperAdmin = roles.Contains("Super Admin") || user?.Username == "admin";
        var isEmployer = roles.Contains("Nhà tuyển dụng");

        if (isSuperAdmin)
        {
            if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<JobStatus>(request.Status, true, out var statusEnum))
            {
                query = query.Where(j => j.Status == statusEnum);
            }
        }
        else if (isEmployer)
        {
            var employer = await _context.Employers
                .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
            if (employer != null)
            {
                query = query.Where(j => j.CompanyId == employer.CompanyId);
            }
            else
            {
                query = query.Where(j => false);
            }

            if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<JobStatus>(request.Status, true, out var statusEnum))
            {
                query = query.Where(j => j.Status == statusEnum);
            }
        }
        else
        {
            // Public / Candidate can only see PUBLISHED jobs
            query = query.Where(j => j.Status == JobStatus.PUBLISHED);
        }

        var now = DateTime.UtcNow;

        // Apply clean, normalized filtering
        query = JobFilteringHelper.ApplyCommonFilters(
            query,
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

        var total = await query.CountAsync(cancellationToken);

        // Sorting
        var sortMode = (request.Sort ?? "newest").Trim().ToLowerInvariant();
        if (sortMode == "salary_desc" || sortMode == "salary")
        {
            query = query
                .OrderByDescending(j => j.SalaryTo ?? j.SalaryFrom ?? 0)
                .ThenByDescending(j => j.CreatedAt);
        }
        else if (sortMode == "relevance")
        {
            var kw = (request.Search ?? request.Q)?.Trim().ToLowerInvariant();
            if (!string.IsNullOrEmpty(kw))
            {
                query = query
                    .OrderByDescending(j => j.Title.ToLower().Contains(kw))
                    .ThenByDescending(j => j.CreatedAt);
            }
            else
            {
                query = query.OrderByDescending(j => j.CreatedAt);
            }
        }
        else
        {
            // Default newest: featured first, then urgent, then priority, then newest created
            query = query
                .OrderByDescending(j => j.IsFeatured && (j.FeaturedUntil == null || j.FeaturedUntil > now))
                .ThenByDescending(j => j.IsUrgent && (j.UrgentUntil == null || j.UrgentUntil > now))
                .ThenByDescending(j => j.PriorityOrder)
                .ThenByDescending(j => j.CreatedAt);
        }

        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var rawItems = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rawItems.Select(j => new JobDto(
            j.Id,
            j.EmployerId,
            j.Company?.Name ?? "Hệ thống HR",
            j.Company?.LogoUrl,
            j.Title,
            j.Description,
            j.Requirements,
            j.Benefits,
            j.SalaryFrom,
            j.SalaryTo,
            j.City,
            j.Status.ToString(),
            j.ExpiredAt,
            j.CreatedAt,
            j.IsFeatured && (j.FeaturedUntil == null || j.FeaturedUntil > now),
            j.FeaturedUntil,
            j.IsUrgent && (j.UrgentUntil == null || j.UrgentUntil > now),
            j.UrgentUntil,
            j.RiskScore,
            j.FraudWarningFlags,
            j.ModerationStatus,
            j.CompanyId,
            j.Department,
            j.Category,
            j.EmploymentType,
            j.Country,
            j.District,
            j.Office,
            j.WorkMode.ToString(),
            j.SalaryType.ToString(),
            j.ExperienceLevel,
            j.ExperienceYearsMin,
            j.Education,
            j.ProbationDuration,
            j.Openings,
            j.HiredCount,
            j.ProvinceCode,
            j.CategoryCode
        )).ToList();

        return new PagedResult<JobDto>
        {
            Items = items,
            Meta = new PagingMeta { Page = page, PageSize = pageSize, Total = total }
        };
    }
}
