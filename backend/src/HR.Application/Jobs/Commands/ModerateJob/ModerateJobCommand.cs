using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs.Commands.ModerateJob;

public record ModerateJobCommand(int JobId, ModerateJobRequest Request) : IRequest<bool>;

public class ModerateJobRequest
{
    /// <summary>
    /// APPROVE, REJECT_LOCK, FLAG_RISK
    /// </summary>
    public string Action { get; set; } = "APPROVE";
    public string? Note { get; set; }
}

public class ModerateJobCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    INotificationSender notificationSender) : IRequestHandler<ModerateJobCommand, bool>
{
    public async Task<bool> Handle(ModerateJobCommand command, CancellationToken cancellationToken)
    {
        var job = await context.Jobs
            .Include(j => j.Company)
            .Include(j => j.Employer)
            .FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken);

        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Không tìm thấy tin tuyển dụng.");
        }

        var action = command.Request.Action?.Trim().ToUpperInvariant() ?? "APPROVE";
        job.ModeratedAt = DateTime.UtcNow;
        job.ModerationNotes = command.Request.Note?.Trim();

        switch (action)
        {
            case "APPROVE":
                job.ModerationStatus = "APPROVED";
                job.Status = JobStatus.PUBLISHED;
                job.RiskScore = 0; // Cleared by moderator
                break;

            case "REJECT_LOCK":
                job.ModerationStatus = "REJECTED_FRAUD";
                job.Status = JobStatus.REJECTED;
                if (job.RiskScore < 80) job.RiskScore = 80;

                // Notify employer
                if (job.Employer?.UserId > 0)
                {
                    await notificationSender.SendNotificationAsync(
                        job.Employer.UserId,
                        "⚠️ Tin tuyển dụng đã bị khoá do vi phạm tiêu chuẩn",
                        $"Tin tuyển dụng \"{job.Title}\" đã bị kiểm duyệt và gỡ bỏ do vi phạm chính sách nội dung/dấu hiệu rủi ro. Lý do: {command.Request.Note ?? "Không phù hợp quy chuẩn HR Portal"}.",
                        NotificationType.JOB_ALERT,
                        "/employer/jobs",
                        cancellationToken);
                }
                break;

            case "FLAG_RISK":
                job.ModerationStatus = "FLAGGED_RISK";
                break;

            default:
                throw new BadRequestException("INVALID_ACTION", "Hành động kiểm duyệt không hợp lệ. Chọn APPROVE, REJECT_LOCK hoặc FLAG_RISK.");
        }

        // Audit Log
        context.LogActivities.Add(new LogActivity
        {
            ModuleName = "JobModeration",
            EntityId = job.Id,
            Action = $"MODERATE_{action}",
            UserId = currentUserService.UserId > 0 ? currentUserService.UserId : null,
            AfterValue = $"Hành động: {action}, Ghi chú: {command.Request.Note}"
        });

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
