using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
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

        // Filter by search / keyword
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var kw = request.Search.ToLower();
            query = query.Where(j => j.Title.ToLower().Contains(kw) 
                || j.Description.ToLower().Contains(kw)
                || j.Requirements.ToLower().Contains(kw));
        }

        // Filter by city
        if (!string.IsNullOrWhiteSpace(request.City))
        {
            query = query.Where(j => j.City == request.City);
        }

        // Filter by SalaryFrom
        if (request.SalaryFrom.HasValue)
        {
            query = query.Where(j => j.SalaryTo >= request.SalaryFrom.Value || j.SalaryTo == null);
        }

        var total = await query.CountAsync(cancellationToken);

        var rawItems = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
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
            j.CreatedAt
        )).ToList();

        return new PagedResult<JobDto>
        {
            Items = items,
            Meta = new PagingMeta { Page = request.Page, PageSize = request.PageSize, Total = total }
        };
    }
}
