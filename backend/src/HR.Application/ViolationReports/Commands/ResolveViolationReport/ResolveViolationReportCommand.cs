using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.ViolationReports.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.ViolationReports.Commands.ResolveViolationReport;

public record ResolveViolationReportCommand(int ReportId, ResolveViolationReportRequest Request) : IRequest<bool>;

public class ResolveViolationReportCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<ResolveViolationReportCommand, bool>
{
    public async Task<bool> Handle(ResolveViolationReportCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var userId = currentUserService.UserId;

        var report = await context.ViolationReports
            .FirstOrDefaultAsync(r => r.Id == command.ReportId && r.DeletedAt == null, cancellationToken);

        if (report == null)
        {
            throw new NotFoundException("REPORT_NOT_FOUND", "Báo cáo vi phạm không tồn tại.");
        }

        report.Status = req.Status;
        report.Resolution = req.Resolution?.Trim();
        report.ResolvedById = userId;
        report.UpdatedAt = DateTime.UtcNow;

        if (req.HideTarget)
        {
            if (report.TargetType == ViolationTargetType.JOB)
            {
                var job = await context.Jobs.FirstOrDefaultAsync(j => j.Id == report.TargetId, cancellationToken);
                if (job != null)
                {
                    job.Status = JobStatus.CLOSED;
                    job.DeletedAt = DateTime.UtcNow; // Ẩn tin vi phạm
                }
            }
            else if (report.TargetType == ViolationTargetType.COMPANY)
            {
                var company = await context.Companies.FirstOrDefaultAsync(c => c.Id == report.TargetId, cancellationToken);
                if (company != null)
                {
                    company.IsVerified = false;
                    company.DeletedAt = DateTime.UtcNow; // Ẩn doanh nghiệp vi phạm
                }
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
