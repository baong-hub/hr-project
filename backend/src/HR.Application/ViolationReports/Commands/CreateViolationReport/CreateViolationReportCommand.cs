using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.ViolationReports.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.ViolationReports.Commands.CreateViolationReport;

public record CreateViolationReportCommand(CreateViolationReportRequest Request) : IRequest<ViolationReportDto>;

public class CreateViolationReportCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<CreateViolationReportCommand, ViolationReportDto>
{
    public async Task<ViolationReportDto> Handle(CreateViolationReportCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var userId = currentUserService.UserId;

        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            throw new BadRequestException("INVALID_REASON", "Lý do báo cáo vi phạm không được để trống.");
        }

        var candidate = await context.Candidates
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == userId && c.DeletedAt == null, cancellationToken);

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (candidate == null && user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy thông tin người dùng gửi báo cáo.");
        }

        var reporterId = candidate?.Id ?? user?.Id ?? userId;
        var reporterName = candidate?.FullName ?? user?.FullName ?? user?.Username ?? "Ứng viên";

        string targetTitle = string.Empty;
        if (req.TargetType == ViolationTargetType.JOB)
        {
            var job = await context.Jobs.FirstOrDefaultAsync(j => j.Id == req.TargetId && j.DeletedAt == null, cancellationToken);
            if (job == null) throw new NotFoundException("JOB_NOT_FOUND", "Tin tuyển dụng cần báo cáo không tồn tại.");
            targetTitle = job.Title;
        }
        else if (req.TargetType == ViolationTargetType.COMPANY)
        {
            var company = await context.Companies.FirstOrDefaultAsync(c => c.Id == req.TargetId && c.DeletedAt == null, cancellationToken);
            if (company == null) throw new NotFoundException("COMPANY_NOT_FOUND", "Doanh nghiệp cần báo cáo không tồn tại.");
            targetTitle = company.Name;
        }

        var report = new ViolationReport
        {
            ReporterId = reporterId,
            TargetType = req.TargetType,
            TargetId = req.TargetId,
            Reason = req.Reason.Trim(),
            Description = req.Description?.Trim(),
            Status = ViolationStatus.PENDING,
            CreatedAt = DateTime.UtcNow
        };

        context.ViolationReports.Add(report);
        await context.SaveChangesAsync(cancellationToken);

        return new ViolationReportDto
        {
            Id = report.Id,
            ReporterId = reporterId,
            ReporterName = reporterName,
            TargetType = report.TargetType,
            TargetId = report.TargetId,
            TargetTitle = targetTitle,
            Reason = report.Reason,
            Description = report.Description,
            Status = report.Status,
            CreatedAt = report.CreatedAt
        };
    }
}
