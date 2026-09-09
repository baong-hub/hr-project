using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Reports.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Reports.Queries.GetRecruitmentFunnel;

public class GetRecruitmentFunnelQueryHandler : IRequestHandler<GetRecruitmentFunnelQuery, RecruitmentFunnelDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetRecruitmentFunnelQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<RecruitmentFunnelDto> Handle(GetRecruitmentFunnelQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var employer = await _context.Employers
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

        if (employer == null)
        {
            throw new ForbiddenException("Tài khoản của bạn không thuộc vai trò Nhà tuyển dụng");
        }

        var jobIds = await _context.Jobs
            .Where(j => j.EmployerId == employer.Id && j.DeletedAt == null)
            .Select(j => j.Id)
            .ToListAsync(cancellationToken);

        if (jobIds.Count == 0)
        {
            return new RecruitmentFunnelDto(new List<FunnelStageDto>
            {
                new("APPLIED", 0),
                new("SCREENING", 0),
                new("SHORTLISTED", 0),
                new("INTERVIEW", 0),
                new("OFFER", 0),
                new("HIRED", 0),
                new("REJECTED", 0)
            });
        }

        // Parse date filters
        var fromDate = string.IsNullOrEmpty(request.From)
            ? (DateTime?)null
            : DateTime.Parse(request.From);

        var toDate = string.IsNullOrEmpty(request.To)
            ? (DateTime?)null
            : DateTime.Parse(request.To).AddDays(1).AddTicks(-1);

        // Query applications with optional date filter
        var appsQuery = _context.Applications
            .Where(a => jobIds.Contains(a.JobId) && a.DeletedAt == null);

        if (fromDate.HasValue)
            appsQuery = appsQuery.Where(a => a.AppliedAt >= fromDate.Value);
        if (toDate.HasValue)
            appsQuery = appsQuery.Where(a => a.AppliedAt <= toDate.Value);

        var applicationCounts = await appsQuery
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var statusDict = applicationCounts.ToDictionary(x => x.Status, x => x.Count);

        // Get individual counts by current status
        int GetCount(ApplicationStatus status) =>
            statusDict.TryGetValue(status, out var c) ? c : 0;

        var appliedOnly = GetCount(ApplicationStatus.APPLIED);
        var screeningOnly = GetCount(ApplicationStatus.SCREENING);
        var shortlistedOnly = GetCount(ApplicationStatus.SHORTLISTED);
        var interviewOnly = GetCount(ApplicationStatus.INTERVIEW);
        var offerOnly = GetCount(ApplicationStatus.OFFER);
        var hiredOnly = GetCount(ApplicationStatus.HIRED);
        var rejectedOnly = GetCount(ApplicationStatus.REJECTED);
        var withdrawnOnly = GetCount(ApplicationStatus.WITHDRAWN);

        // Cumulative funnel: each stage includes applications that have progressed 
        // past it. The status progression is: APPLIED -> SCREENING -> SHORTLISTED -> INTERVIEW -> OFFER -> HIRED
        // An application at HIRED has passed through all previous stages.
        // REJECTED/WITHDRAWN are terminal states counted separately.
        var hiredCumulative = hiredOnly;
        var offerCumulative = offerOnly + hiredCumulative;
        var interviewCumulative = interviewOnly + offerCumulative;
        var shortlistedCumulative = shortlistedOnly + interviewCumulative;
        var screeningCumulative = screeningOnly + shortlistedCumulative;
        var appliedCumulative = appliedOnly + screeningCumulative + rejectedOnly + withdrawnOnly;

        var stages = new List<FunnelStageDto>
        {
            new("APPLIED", appliedCumulative),
            new("SCREENING", screeningCumulative),
            new("SHORTLISTED", shortlistedCumulative),
            new("INTERVIEW", interviewCumulative),
            new("OFFER", offerCumulative),
            new("HIRED", hiredCumulative),
            new("REJECTED", rejectedOnly)
        };

        return new RecruitmentFunnelDto(stages);
    }
}
