using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Reports.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Reports.Queries.GetEmployerSummary;

public class GetEmployerSummaryQueryHandler : IRequestHandler<GetEmployerSummaryQuery, EmployerSummaryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEmployerSummaryQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployerSummaryDto> Handle(GetEmployerSummaryQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var employer = await _context.Employers
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

        if (employer == null)
        {
            throw new ForbiddenException("Tài khoản của bạn không thuộc vai trò Nhà tuyển dụng");
        }

        var fromDate = string.IsNullOrEmpty(request.From)
            ? DateTime.Today.AddDays(-30)
            : DateTime.Parse(request.From);

        var toDate = string.IsNullOrEmpty(request.To)
            ? DateTime.Today.AddDays(1).AddTicks(-1)
            : DateTime.Parse(request.To).AddDays(1).AddTicks(-1);

        var jobIds = await _context.Jobs
            .Where(j => j.EmployerId == employer.Id && j.DeletedAt == null)
            .Select(j => j.Id)
            .ToListAsync(cancellationToken);

        if (jobIds.Count == 0)
        {
            return new EmployerSummaryDto(0, 0, 0, 0.0);
        }

        var totalActiveJobs = await _context.Jobs
            .CountAsync(j => j.EmployerId == employer.Id && j.Status == Domain.Enums.JobStatus.PUBLISHED && j.DeletedAt == null, cancellationToken);

        var totalApplications = await _context.Applications
            .CountAsync(a => jobIds.Contains(a.JobId) && a.AppliedAt >= fromDate && a.AppliedAt <= toDate && a.DeletedAt == null, cancellationToken);

        var totalViews = await _context.JobViewLogs
            .CountAsync(log => jobIds.Contains(log.JobId) && log.ViewedAt >= fromDate && log.ViewedAt <= toDate, cancellationToken);

        var averageApplyRate = totalViews > 0
            ? Math.Round((double)totalApplications / totalViews * 100, 1)
            : 0.0;

        // Detailed interview & funnel analytics (filtered by date range for consistency)
        var appIds = await _context.Applications
            .Where(a => jobIds.Contains(a.JobId) && a.AppliedAt >= fromDate && a.AppliedAt <= toDate && a.DeletedAt == null)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        var totalInterviews = appIds.Count > 0
            ? await _context.Interviews
                .CountAsync(i => appIds.Contains(i.ApplicationId) && i.DeletedAt == null, cancellationToken)
            : 0;

        var completedInterviews = appIds.Count > 0
            ? await _context.Interviews
                .CountAsync(i => appIds.Contains(i.ApplicationId) && 
                    i.Status == Domain.Enums.InterviewStatus.INTERVIEW_COMPLETED && 
                    i.DeletedAt == null, cancellationToken)
            : 0;

        var totalOffers = await _context.Applications
            .CountAsync(a => jobIds.Contains(a.JobId) && 
                a.AppliedAt >= fromDate && a.AppliedAt <= toDate &&
                (a.Status == Domain.Enums.ApplicationStatus.OFFER || a.Status == Domain.Enums.ApplicationStatus.HIRED) && 
                a.DeletedAt == null, cancellationToken);

        var hiredApps = await _context.Applications
            .Where(a => jobIds.Contains(a.JobId) && 
                a.AppliedAt >= fromDate && a.AppliedAt <= toDate &&
                a.Status == Domain.Enums.ApplicationStatus.HIRED && a.DeletedAt == null)
            .Select(a => new { a.AppliedAt, a.UpdatedAt })
            .ToListAsync(cancellationToken);

        var totalHired = hiredApps.Count;

        var averageTimeToHireDays = totalHired > 0
            ? Math.Round(hiredApps.Average(a => Math.Max(0.5, (a.UpdatedAt - a.AppliedAt).TotalDays)), 1)
            : 0.0;

        var offerAcceptanceRate = totalOffers > 0
            ? Math.Round((double)totalHired / totalOffers * 100, 1)
            : 0.0;

        // Top performing jobs
        var topJobsData = await _context.Jobs
            .Where(j => j.EmployerId == employer.Id && j.DeletedAt == null)
            .Select(j => new
            {
                j.Id,
                j.Title,
                j.Status,
                Apps = _context.Applications.Count(a => a.JobId == j.Id && a.DeletedAt == null),
                Views = _context.JobViewLogs.Count(v => v.JobId == j.Id)
            })
            .OrderByDescending(j => j.Apps)
            .ThenByDescending(j => j.Views)
            .Take(5)
            .ToListAsync(cancellationToken);

        var topJobs = topJobsData.Select(j => new TopJobSummaryDto(
            j.Id,
            j.Title,
            j.Views,
            j.Apps,
            j.Views > 0 ? Math.Round((double)j.Apps / j.Views * 100, 1) : 0.0,
            j.Status.ToString()
        )).ToList();

        return new EmployerSummaryDto(
            totalActiveJobs,
            totalApplications,
            totalViews,
            averageApplyRate,
            totalInterviews,
            completedInterviews,
            totalOffers,
            totalHired,
            averageTimeToHireDays,
            offerAcceptanceRate,
            topJobs
        );
    }
}
