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

        var appsInScope = await appsQuery.Select(a => new { a.Id, a.Status }).ToListAsync(cancellationToken);
        var inScopeAppIds = appsInScope.Select(a => a.Id).ToList();

        if (inScopeAppIds.Count == 0)
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

        // Applications with JobOffers in database
        var offerAppIds = await _context.JobOffers
            .Where(o => inScopeAppIds.Contains(o.ApplicationId) && o.DeletedAt == null)
            .Select(o => o.ApplicationId)
            .Distinct()
            .ToListAsync(cancellationToken);

        // Applications with Interviews in database
        var interviewAppIds = await _context.Interviews
            .Where(i => inScopeAppIds.Contains(i.ApplicationId) && i.DeletedAt == null)
            .Select(i => i.ApplicationId)
            .Distinct()
            .ToListAsync(cancellationToken);

        // HIRED: Status HIRED or JobOffer ACCEPTED
        var acceptedOfferAppIds = await _context.JobOffers
            .Where(o => inScopeAppIds.Contains(o.ApplicationId) && o.Status == JobOfferStatus.ACCEPTED && o.DeletedAt == null)
            .Select(o => o.ApplicationId)
            .ToListAsync(cancellationToken);

        var hiredAppIds = appsInScope
            .Where(a => a.Status == ApplicationStatus.HIRED)
            .Select(a => a.Id)
            .Union(acceptedOfferAppIds)
            .Distinct()
            .ToList();

        // OFFER: Status OFFER, or JobOffer exists, or reached HIRED
        var allOfferAppIds = appsInScope
            .Where(a => a.Status == ApplicationStatus.OFFER)
            .Select(a => a.Id)
            .Union(offerAppIds)
            .Union(hiredAppIds)
            .Distinct()
            .ToList();

        // INTERVIEW: Status INTERVIEW, or Interview exists, or reached OFFER
        var allInterviewAppIds = appsInScope
            .Where(a => a.Status == ApplicationStatus.INTERVIEW)
            .Select(a => a.Id)
            .Union(interviewAppIds)
            .Union(allOfferAppIds)
            .Distinct()
            .ToList();

        // SHORTLISTED: Status SHORTLISTED or reached INTERVIEW
        var allShortlistedAppIds = appsInScope
            .Where(a => a.Status == ApplicationStatus.SHORTLISTED)
            .Select(a => a.Id)
            .Union(allInterviewAppIds)
            .Distinct()
            .ToList();

        // SCREENING: Status SCREENING or reached SHORTLISTED
        var allScreeningAppIds = appsInScope
            .Where(a => a.Status == ApplicationStatus.SCREENING)
            .Select(a => a.Id)
            .Union(allShortlistedAppIds)
            .Distinct()
            .ToList();

        var totalApplied = appsInScope.Count;
        var rejectedCount = appsInScope.Count(a => a.Status == ApplicationStatus.REJECTED);

        var stages = new List<FunnelStageDto>
        {
            new("APPLIED", totalApplied),
            new("SCREENING", Math.Max(allScreeningAppIds.Count, allShortlistedAppIds.Count)),
            new("SHORTLISTED", Math.Max(allShortlistedAppIds.Count, allInterviewAppIds.Count)),
            new("INTERVIEW", Math.Max(allInterviewAppIds.Count, allOfferAppIds.Count)),
            new("OFFER", allOfferAppIds.Count),
            new("HIRED", hiredAppIds.Count),
            new("REJECTED", rejectedCount)
        };

        return new RecruitmentFunnelDto(stages);
    }
}
