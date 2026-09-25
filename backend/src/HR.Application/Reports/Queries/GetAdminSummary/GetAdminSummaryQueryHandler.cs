using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Reports.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Reports.Queries.GetAdminSummary;

public class GetAdminSummaryQueryHandler : IRequestHandler<GetAdminSummaryQuery, AdminSummaryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAdminSummaryQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AdminSummaryDto> Handle(GetAdminSummaryQuery request, CancellationToken cancellationToken)
    {
        var isAdmin = _currentUserService.HasPermission("report:view_all");
        if (!isAdmin)
        {
            throw new ForbiddenException("Bạn không có quyền truy cập dữ liệu báo cáo hệ thống");
        }

        DateTime now = DateTime.UtcNow;
        DateTime fromDate;
        DateTime toDate = now;
        DateTime prevFromDate;
        DateTime prevToDate;

        if (!string.IsNullOrWhiteSpace(request.Range))
        {
            switch (request.Range.ToLower())
            {
                case "7":
                    fromDate = now.AddDays(-7);
                    prevFromDate = fromDate.AddDays(-7);
                    prevToDate = fromDate;
                    break;
                case "month":
                    fromDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                    var prevMonth = fromDate.AddMonths(-1);
                    prevFromDate = prevMonth;
                    prevToDate = fromDate;
                    break;
                case "30":
                default:
                    fromDate = now.AddDays(-30);
                    prevFromDate = fromDate.AddDays(-30);
                    prevToDate = fromDate;
                    break;
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.From) && DateTime.TryParse(request.From, out var parsedFrom))
        {
            fromDate = DateTime.SpecifyKind(parsedFrom, DateTimeKind.Utc);
            if (!string.IsNullOrWhiteSpace(request.To) && DateTime.TryParse(request.To, out var parsedTo))
            {
                toDate = DateTime.SpecifyKind(parsedTo, DateTimeKind.Utc);
            }
            var span = toDate - fromDate;
            prevToDate = fromDate;
            prevFromDate = fromDate - span;
        }
        else
        {
            // Default 30 days
            fromDate = now.AddDays(-30);
            prevFromDate = fromDate.AddDays(-30);
            prevToDate = fromDate;
        }

        // Current period counts
        var totalCompanies = await _context.Companies
            .CountAsync(c => c.DeletedAt == null && c.CreatedAt >= fromDate && c.CreatedAt <= toDate, cancellationToken);
        var totalCandidates = await _context.Candidates
            .CountAsync(c => c.DeletedAt == null && c.CreatedAt >= fromDate && c.CreatedAt <= toDate, cancellationToken);
        var totalJobs = await _context.Jobs
            .CountAsync(j => j.DeletedAt == null && j.CreatedAt >= fromDate && j.CreatedAt <= toDate, cancellationToken);
        var totalApplications = await _context.Applications
            .CountAsync(a => a.DeletedAt == null && a.AppliedAt >= fromDate && a.AppliedAt <= toDate, cancellationToken);

        // All active jobs in the period
        var activeJobs = await _context.Jobs
            .CountAsync(j => j.DeletedAt == null && j.Status == HR.Domain.Enums.JobStatus.PUBLISHED && j.CreatedAt >= fromDate && j.CreatedAt <= toDate, cancellationToken);

        // If no items in period (e.g. fresh db or range is too narrow), fallback to all-time active count if totalJobs == 0
        if (totalJobs == 0)
        {
            totalCompanies = await _context.Companies.CountAsync(c => c.DeletedAt == null, cancellationToken);
            totalCandidates = await _context.Candidates.CountAsync(c => c.DeletedAt == null, cancellationToken);
            totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null, cancellationToken);
            totalApplications = await _context.Applications.CountAsync(a => a.DeletedAt == null, cancellationToken);
            activeJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null && j.Status == HR.Domain.Enums.JobStatus.PUBLISHED, cancellationToken);
        }


        // Previous period counts for trends
        var prevCompanies = await _context.Companies
            .CountAsync(c => c.DeletedAt == null && c.CreatedAt >= prevFromDate && c.CreatedAt < prevToDate, cancellationToken);
        var prevCandidates = await _context.Candidates
            .CountAsync(c => c.DeletedAt == null && c.CreatedAt >= prevFromDate && c.CreatedAt < prevToDate, cancellationToken);
        var prevJobs = await _context.Jobs
            .CountAsync(j => j.DeletedAt == null && j.CreatedAt >= prevFromDate && j.CreatedAt < prevToDate, cancellationToken);
        var prevApplications = await _context.Applications
            .CountAsync(a => a.DeletedAt == null && a.AppliedAt >= prevFromDate && a.AppliedAt < prevToDate, cancellationToken);

        // Calculations
        double activeJobsRate = totalJobs > 0 ? Math.Round((double)activeJobs / totalJobs * 100, 1) : 0;

        int CalculateTrend(int current, int previous)
        {
            if (previous == 0) return current > 0 ? 100 : 0;
            return (int)Math.Round((double)(current - previous) / previous * 100);
        }

        string GetTrendLabel(int trendPct)
        {
            if (trendPct >= 20) return "Tăng trưởng nhanh";
            if (trendPct > 0) return "Tăng trưởng ổn định";
            if (trendPct == 0) return "Ổn định";
            if (trendPct >= -20) return "Giảm nhẹ";
            return "Cần thúc đẩy";
        }

        int candidatesTrend = CalculateTrend(totalCandidates, prevCandidates);
        int companiesTrend = CalculateTrend(totalCompanies, prevCompanies);
        int jobsTrend = CalculateTrend(totalJobs, prevJobs);
        int applicationsTrend = CalculateTrend(totalApplications, prevApplications);

        return new AdminSummaryDto(
            TotalCompanies: totalCompanies,
            TotalCandidates: totalCandidates,
            TotalJobs: totalJobs,
            TotalApplications: totalApplications,
            ActiveJobs: activeJobs,
            ActiveJobsRate: activeJobsRate,
            CandidatesTrendPercentage: candidatesTrend,
            CompaniesTrendPercentage: companiesTrend,
            JobsTrendPercentage: jobsTrend,
            ApplicationsTrendPercentage: applicationsTrend,
            JobsTrendLabel: GetTrendLabel(jobsTrend),
            ApplicationsTrendLabel: GetTrendLabel(applicationsTrend)
        );
    }
}

