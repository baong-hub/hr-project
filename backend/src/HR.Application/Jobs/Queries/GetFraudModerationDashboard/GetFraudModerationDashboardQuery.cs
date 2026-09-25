using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Jobs.Dtos;
using HR.Application.ViolationReports.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs.Queries.GetFraudModerationDashboard;

public record GetFraudModerationDashboardQuery : IRequest<FraudModerationDashboardDto>;

public class FraudModerationDashboardDto
{
    public int TotalJobsCount { get; set; }
    public int FlaggedRiskJobsCount { get; set; }
    public int PendingReviewJobsCount { get; set; }
    public int CleanJobsCount { get; set; }
    public int PendingViolationReportsCount { get; set; }
    public int ResolvedViolationReportsCount { get; set; }
    public List<JobDto> FlaggedJobs { get; set; } = new();
    public List<ViolationReportDto> RecentViolationReports { get; set; } = new();
}

public class GetFraudModerationDashboardQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetFraudModerationDashboardQuery, FraudModerationDashboardDto>
{
    public async Task<FraudModerationDashboardDto> Handle(GetFraudModerationDashboardQuery request, CancellationToken cancellationToken)
    {
        var totalJobs = await context.Jobs.CountAsync(j => j.DeletedAt == null, cancellationToken);
        var flaggedCount = await context.Jobs.CountAsync(j => j.DeletedAt == null && (j.RiskScore >= 40 || j.ModerationStatus == "FLAGGED_RISK"), cancellationToken);
        var pendingReviewCount = await context.Jobs.CountAsync(j => j.DeletedAt == null && (j.ModerationStatus == "PENDING_REVIEW" || j.Status == JobStatus.PENDING_REVIEW), cancellationToken);
        var cleanCount = Math.Max(0, totalJobs - flaggedCount);

        var pendingReports = await context.ViolationReports.CountAsync(v => v.Status == ViolationStatus.PENDING, cancellationToken);
        var resolvedReports = await context.ViolationReports.CountAsync(v => v.Status == ViolationStatus.RESOLVED, cancellationToken);

        // Fetch high-risk / flagged jobs
        var flaggedJobEntities = await context.Jobs
            .Include(j => j.Company)
            .Include(j => j.Employer)
            .Where(j => j.DeletedAt == null && (j.RiskScore >= 30 || j.ModerationStatus == "FLAGGED_RISK" || j.Status == JobStatus.REJECTED))
            .OrderByDescending(j => j.RiskScore)
            .ThenByDescending(j => j.CreatedAt)
            .Take(30)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var flaggedJobDtos = flaggedJobEntities.Select(j => new JobDto(
            j.Id,
            j.EmployerId,
            j.Company?.Name ?? "Công ty tuyển dụng",
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
            j.ModerationStatus
        )).ToList();

        // Fetch recent violation reports
        var recentReports = await context.ViolationReports
            .Include(v => v.Reporter)
                .ThenInclude(r => r.User)
            .OrderByDescending(v => v.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        var reportDtos = recentReports.Select(v => new ViolationReportDto
        {
            Id = v.Id,
            ReporterId = v.ReporterId,
            ReporterName = v.Reporter?.FullName ?? v.Reporter?.User?.FullName ?? "Ứng viên ẩn danh",
            TargetType = v.TargetType,
            TargetId = v.TargetId,
            TargetTitle = $"Mục ID #{v.TargetId} ({v.TargetType})",
            Reason = v.Reason,
            Description = v.Description,
            Status = v.Status,
            Resolution = v.Resolution,
            ResolvedById = v.ResolvedById,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        }).ToList();

        return new FraudModerationDashboardDto
        {
            TotalJobsCount = totalJobs,
            FlaggedRiskJobsCount = flaggedCount,
            PendingReviewJobsCount = pendingReviewCount,
            CleanJobsCount = cleanCount,
            PendingViolationReportsCount = pendingReports,
            ResolvedViolationReportsCount = resolvedReports,
            FlaggedJobs = flaggedJobDtos,
            RecentViolationReports = reportDtos
        };
    }
}
