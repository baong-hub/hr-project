using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Interviews;

/// <summary>
/// EP-03 Handler: GET /api/v1/interviews — Danh sách lịch phỏng vấn (phân trang)
/// Data scope: Candidate chỉ thấy interview của mình, Employer chỉ thấy company mình.
/// </summary>
public class GetInterviewsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IRequestHandler<GetInterviewsQuery, PagedResult<InterviewDto>>
{
    public async Task<PagedResult<InterviewDto>> Handle(GetInterviewsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;

        var query = context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .Include(i => i.Application)
                .ThenInclude(a => a.Candidate)
            .Include(i => i.Interviewer)
                .ThenInclude(e => e.User)
            .AsNoTracking();

        // Data scope filtering
        var candidate = await context.Candidates
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == userId, cancellationToken);

        if (candidate != null)
        {
            // Candidate: only their own interviews
            query = query.Where(i => i.Application.CandidateId == userId);
        }
        else if (!currentUserService.IsSuperAdmin)
        {
            // Employer: only company interviews
            var employer = await context.Employers
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
            if (employer?.CompanyId != null)
            {
                query = query.Where(i => i.Application.Job.CompanyId == employer.CompanyId);
            }
            else
            {
                query = query.Where(i => false);
            }
        }

        // Status filter
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(i => i.Status.ToString() == request.Status.ToUpper());
        }

        // Search filter (job title or candidate name)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(i =>
                i.Application.Job.Title.ToLower().Contains(search) ||
                i.Application.Candidate.FullName.ToLower().Contains(search));
        }

        // Sorting
        query = request.Sort switch
        {
            "-startTime" => query.OrderByDescending(i => i.StartTime),
            "startTime" => query.OrderBy(i => i.StartTime),
            "-createdAt" => query.OrderByDescending(i => i.CreatedAt),
            "createdAt" => query.OrderBy(i => i.CreatedAt),
            _ => query.OrderByDescending(i => i.StartTime)
        };

        // Pagination
        var total = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new InterviewDto(
                i.Id,
                i.ApplicationId,
                i.Application.Job.Title,
                i.Application.Candidate.FullName,
                i.Application.Candidate.User.Email,
                i.Application.Job.Company.Name,
                i.StartTime,
                i.EndTime,
                i.InterviewType.ToString(),
                i.LocationOrLink ?? string.Empty,
                i.Notes,
                i.Status.ToString()
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<InterviewDto>
        {
            Items = items,
            Meta = new PagingMeta
            {
                Page = page,
                PageSize = pageSize,
                Total = total
            }
        };
    }
}

/// <summary>
/// EP-02 Handler: GET /api/v1/interviews/{id} — Chi tiết lịch phỏng vấn
/// </summary>
public class GetInterviewByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetInterviewByIdQuery, InterviewDto?>
{
    public async Task<InterviewDto?> Handle(GetInterviewByIdQuery request, CancellationToken cancellationToken)
    {
        var i = await context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .Include(i => i.Application)
                .ThenInclude(a => a.Candidate)
                    .ThenInclude(c => c.User)
            .Include(i => i.Interviewer)
                .ThenInclude(e => e.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (i == null) return null;

        return new InterviewDto(
            i.Id,
            i.ApplicationId,
            i.Application.Job.Title,
            i.Application.Candidate.FullName,
            i.Application.Candidate.User.Email,
            i.Application.Job.Company.Name,
            i.StartTime,
            i.EndTime,
            i.InterviewType.ToString(),
            i.LocationOrLink ?? string.Empty,
            i.Notes,
            i.Status.ToString()
        );
    }
}
