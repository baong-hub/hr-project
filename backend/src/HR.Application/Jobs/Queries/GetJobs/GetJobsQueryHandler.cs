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

        // Filter by city (flexible matching: aliases, accents, abbreviations)
        if (!string.IsNullOrWhiteSpace(request.City))
        {
            var rawCity = request.City.Trim().ToLower();
            if (rawCity == "hcm" || rawCity.Contains("hồ chí minh") || rawCity.Contains("ho chi minh") || rawCity.Contains("sài gòn") || rawCity.Contains("saigon") || rawCity == "tp. hcm" || rawCity == "tp.hcm")
            {
                query = query.Where(j => 
                    j.City.ToLower().Contains("hcm") || 
                    j.City.ToLower().Contains("hồ chí minh") || 
                    j.City.ToLower().Contains("ho chi minh") || 
                    j.City.ToLower().Contains("sài gòn") || 
                    j.City.ToLower().Contains("saigon"));
            }
            else if (rawCity == "hanoi" || rawCity.Contains("hà nội") || rawCity.Contains("ha noi") || rawCity == "hn")
            {
                query = query.Where(j => 
                    j.City.ToLower().Contains("hà nội") || 
                    j.City.ToLower().Contains("ha noi") || 
                    j.City.ToLower().Contains("hanoi") || 
                    j.City.ToLower().Contains("hn"));
            }
            else if (rawCity == "danang" || rawCity.Contains("đà nẵng") || rawCity.Contains("da nang") || rawCity == "dn")
            {
                query = query.Where(j => 
                    j.City.ToLower().Contains("đà nẵng") || 
                    j.City.ToLower().Contains("da nang") || 
                    j.City.ToLower().Contains("danang") || 
                    j.City.ToLower().Contains("dn"));
            }
            else if (rawCity == "haiphong" || rawCity.Contains("hải phòng") || rawCity.Contains("hai phong") || rawCity == "hp")
            {
                query = query.Where(j => 
                    j.City.ToLower().Contains("hải phòng") || 
                    j.City.ToLower().Contains("hai phong") || 
                    j.City.ToLower().Contains("haiphong") || 
                    j.City.ToLower().Contains("hp"));
            }
            else if (rawCity == "cantho" || rawCity.Contains("cần thơ") || rawCity.Contains("can tho") || rawCity == "ct")
            {
                query = query.Where(j => 
                    j.City.ToLower().Contains("cần thơ") || 
                    j.City.ToLower().Contains("can tho") || 
                    j.City.ToLower().Contains("cantho") || 
                    j.City.ToLower().Contains("ct"));
            }
            else if (rawCity == "remote" || rawCity.Contains("từ xa"))
            {
                query = query.Where(j => 
                    j.City.ToLower().Contains("remote") || 
                    j.City.ToLower().Contains("từ xa"));
            }
            else
            {
                query = query.Where(j => j.City.ToLower().Contains(rawCity) || rawCity.Contains(j.City.ToLower()));
            }
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
