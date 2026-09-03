using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Dashboard;

public class GetDashboardStatsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        var user = await context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        var roles = user?.UserRoles.Select(ur => ur.Role.Name).ToList() ?? [];
        var isSuperAdmin = roles.Contains("Super Admin") || user?.Username == "admin";
        var isEmployer = roles.Contains("Nhà tuyển dụng");
        var isCandidate = roles.Contains("Ứng viên");

        string activeRole = "CANDIDATE";
        if (isSuperAdmin) activeRole = "ADMIN";
        else if (isEmployer) activeRole = "EMPLOYER";

        int appliedCount = 0;
        int interviewScheduledCount = 0;
        int savedJobsCount = 0;

        int activeJobsCount = 0;
        int totalApplicantsCount = 0;
        int shortlistedCount = 0;
        int hiredCount = 0;

        int totalCandidatesCount = 0;
        int totalEmployersCount = 0;
        int totalJobsCount = 0;
        int totalCompaniesCount = 0;
        int verificationRequestsCount = 0;

        if (isSuperAdmin)
        {
            totalCandidatesCount = await context.Candidates.CountAsync(cancellationToken);
            totalEmployersCount = await context.Employers.CountAsync(cancellationToken);
            totalJobsCount = await context.Jobs.CountAsync(cancellationToken);
            totalCompaniesCount = await context.Companies.CountAsync(cancellationToken);
            verificationRequestsCount = await context.Companies.CountAsync(c => !c.IsVerified, cancellationToken);
        }

        if (isEmployer || isSuperAdmin)
        {
            var employer = await context.Employers.FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
            if (employer != null || isSuperAdmin)
            {
                var compId = employer?.CompanyId ?? 1;
                activeJobsCount = await context.Jobs.CountAsync(j => j.CompanyId == compId && j.Status == JobStatus.PUBLISHED, cancellationToken);
                totalApplicantsCount = await context.Applications.CountAsync(a => a.Job.CompanyId == compId, cancellationToken);
                shortlistedCount = await context.Applications.CountAsync(a => a.Job.CompanyId == compId && a.Status == ApplicationStatus.SHORTLISTED, cancellationToken);
                hiredCount = await context.Applications.CountAsync(a => a.Job.CompanyId == compId && a.Status == ApplicationStatus.HIRED, cancellationToken);
            }
        }

        if (isCandidate || isSuperAdmin)
        {
            var candidate = await context.Candidates.FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);
            if (candidate != null)
            {
                appliedCount = await context.Applications.CountAsync(a => a.CandidateId == candidate.Id, cancellationToken);
                interviewScheduledCount = await context.Interviews.CountAsync(i => i.Application.CandidateId == candidate.Id && i.Status == HR.Domain.Enums.InterviewStatus.INTERVIEW_SCHEDULED, cancellationToken);
                savedJobsCount = await context.SavedJobs.CountAsync(s => s.CandidateId == candidate.Id, cancellationToken);
            }
        }

        return new DashboardStatsDto(
            activeRole,
            appliedCount,
            interviewScheduledCount,
            savedJobsCount,
            activeJobsCount,
            totalApplicantsCount,
            shortlistedCount,
            hiredCount,
            totalCandidatesCount,
            totalEmployersCount,
            totalJobsCount,
            totalCompaniesCount,
            verificationRequestsCount
        );
    }
}
