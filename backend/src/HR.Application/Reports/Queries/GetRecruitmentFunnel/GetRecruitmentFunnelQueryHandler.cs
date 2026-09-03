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
                new("SUBMITTED", 0),
                new("REVIEWING", 0),
                new("SHORTLISTED", 0),
                new("ACCEPTED", 0)
            });
        }

        var applicationCounts = await _context.Applications
            .Where(a => jobIds.Contains(a.JobId) && a.DeletedAt == null)
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var statusDict = applicationCounts.ToDictionary(x => x.Status, x => x.Count);

        var submittedCount = statusDict.TryGetValue(ApplicationStatus.APPLIED, out var cApplied) ? cApplied : 0;

        var reviewingCount = statusDict.TryGetValue(ApplicationStatus.SCREENING, out var cScreening) ? cScreening : 0;

        var shortlistedCount = 
            (statusDict.TryGetValue(ApplicationStatus.SHORTLISTED, out var cShortlisted) ? cShortlisted : 0) +
            (statusDict.TryGetValue(ApplicationStatus.INTERVIEW, out var cInterview) ? cInterview : 0);

        var acceptedCount = 
            (statusDict.TryGetValue(ApplicationStatus.OFFER, out var cOffer) ? cOffer : 0) +
            (statusDict.TryGetValue(ApplicationStatus.HIRED, out var cHired) ? cHired : 0);

        var stages = new List<FunnelStageDto>
        {
            new("SUBMITTED", submittedCount),
            new("REVIEWING", reviewingCount),
            new("SHORTLISTED", shortlistedCount),
            new("ACCEPTED", acceptedCount)
        };

        return new RecruitmentFunnelDto(stages);
    }
}
