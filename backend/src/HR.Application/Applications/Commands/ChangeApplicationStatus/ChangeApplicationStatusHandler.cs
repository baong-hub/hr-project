using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Models;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

using HR.Application.TechnicalTests.Commands.InviteCandidateTest;

namespace HR.Application.Applications.Commands.ChangeApplicationStatus;

public class ChangeApplicationStatusHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    INotificationSender notificationSender,
    IEmailService emailService,
    IMediator mediator)
    : IRequestHandler<ChangeApplicationStatusCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(ChangeApplicationStatusCommand request, CancellationToken cancellationToken)
    {
        var app = await context.Applications
            .Include(a => a.Job)
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (app == null)
        {
            throw new NotFoundException("APPLICATION_NOT_FOUND", "Đơn ứng tuyển không tồn tại.");
        }

        var job = app.Job ?? await context.Jobs.FirstOrDefaultAsync(j => j.Id == app.JobId, cancellationToken);

        // [BR-03] Lấy đơn ứng tuyển hiện tại: Nếu đang ở trạng thái HIRED hoặc REJECTED thì ném lỗi APPLICATION_STATUS_FINAL
        if (app.Status == ApplicationStatus.HIRED || app.Status == ApplicationStatus.REJECTED)
        {
            throw new BadRequestException("APPLICATION_STATUS_FINAL", "Trạng thái đơn nộp đã hoàn thành, không thể sửa đổi.");
        }

        var userId = currentUserService.UserId;
        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
        var isAdmin = currentUserService.Username == "admin";

        // Kiểm tra quyền sở hữu: Tin tuyển dụng của đơn nộp phải thuộc employerId của user hiện tại
        if (!isAdmin && (employer == null || (job != null && job.CompanyId != employer.CompanyId)))
        {
            throw new ForbiddenException("Bạn không có quyền cập nhật trạng thái đơn ứng tuyển này.");
        }

        if (Enum.TryParse<ApplicationStatus>(request.Status, true, out var newStatus))
        {
            app.Status = newStatus;
            app.UpdatedAt = DateTime.Now;
            app.UpdatedBy = userId;

            await context.SaveChangesAsync(cancellationToken);

            var company = job != null ? (job.Company ?? await context.Companies.FirstOrDefaultAsync(c => c.Id == job.CompanyId, cancellationToken)) : null;
            var candidate = await context.Candidates.FirstOrDefaultAsync(c => c.Id == app.CandidateId, cancellationToken);
            var candidateUser = candidate != null ? await context.Users.FirstOrDefaultAsync(u => u.Id == candidate.UserId, cancellationToken) : null;

            var candidateUserId = candidate?.UserId ?? 0;
            var candidateEmail = candidateUser?.Email ?? string.Empty;
            var candidateName = candidate?.FullName ?? candidateUser?.FullName ?? "Ứng viên";
            var jobTitle = job?.Title ?? "Vị trí tuyển dụng";
            var companyName = company?.Name ?? "Nhà tuyển dụng";

            if (candidateUserId > 0)
            {
                var title = newStatus switch
                {
                    ApplicationStatus.SHORTLISTED => "Hồ sơ của bạn đã được Chọn (Shortlisted)!",
                    ApplicationStatus.OFFER => "Chúc mừng! Đề xuất nhận việc (Job Offer)",
                    ApplicationStatus.HIRED => "Chào mừng bạn! Đã trúng tuyển chính thức",
                    ApplicationStatus.REJECTED => "Thông báo kết quả ứng tuyển",
                    ApplicationStatus.INTERVIEW => "Hồ sơ vào vòng phỏng vấn",
                    _ => $"Cập nhật trạng thái đơn ứng tuyển: {jobTitle}"
                };

                var content = newStatus switch
                {
                    ApplicationStatus.SHORTLISTED => $"Nhà tuyển dụng {companyName} đã đánh giá hồ sơ của bạn phù hợp cho vị trí {jobTitle}.",
                    ApplicationStatus.OFFER => $"Nhà tuyển dụng {companyName} trân trọng gửi đề xuất nhận việc (Offer) cho vị trí {jobTitle}.",
                    ApplicationStatus.HIRED => $"Chúc mừng bạn đã chính thức được tuyển dụng vào vị trí {jobTitle} tại {companyName}!",
                    ApplicationStatus.REJECTED => $"Cảm ơn bạn đã quan tâm ứng tuyển vị trí {jobTitle} tại {companyName}. Rất tiếc hồ sơ chưa phù hợp vào thời điểm này.",
                    ApplicationStatus.INTERVIEW => $"Đơn ứng tuyển vị trí {jobTitle} tại {companyName} đã được chuyển sang giai đoạn phỏng vấn.",
                    _ => $"Trạng thái đơn ứng tuyển cho vị trí {jobTitle} tại {companyName} đã được cập nhật thành: {newStatus}."
                };

                await notificationSender.SendNotificationAsync(
                    candidateUserId,
                    title,
                    content,
                    NotificationType.APPLICATION_STATUS,
                    "/candidate/applications",
                    cancellationToken);
            }

            if (!string.IsNullOrWhiteSpace(candidateEmail))
            {
                if (newStatus == ApplicationStatus.OFFER)
                {
                    _ = emailService.SendOfferLetterEmailAsync(
                        candidateEmail,
                        candidateName,
                        jobTitle,
                        companyName,
                        null,
                        null,
                        "Vui lòng xem chi tiết trên hệ thống HR Portal.",
                        cancellationToken);
                }
                else if (newStatus == ApplicationStatus.SHORTLISTED)
                {
                    _ = emailService.SendShortlistNotificationAsync(
                        candidateEmail,
                        candidateName,
                        jobTitle,
                        companyName,
                        cancellationToken);
                }
                else
                {
                    _ = emailService.SendApplicationStatusEmailAsync(
                        candidateEmail,
                        candidateName,
                        jobTitle,
                        companyName,
                        newStatus.ToString(),
                        null,
                        cancellationToken);
                }
            }

            // [ONLINE ASSESSMENT]: Nếu chuyển sang SCREENING và Job có cấu hình AutoInviteOnScreening -> Tự động mời test
            if (newStatus == ApplicationStatus.SCREENING)
            {
                try
                {
                    var hasAutoTest = await context.JobAssessmentTemplates
                        .AnyAsync(t => t.JobId == app.JobId && t.IsActive && t.AutoInviteOnScreening, cancellationToken);
                    if (hasAutoTest)
                    {
                        var hasPendingTest = await context.TechnicalTests
                            .AnyAsync(t => t.ApplicationId == app.Id && (t.Status == TechnicalTestStatus.PENDING || t.Status == TechnicalTestStatus.IN_PROGRESS), cancellationToken);
                        if (!hasPendingTest)
                        {
                            await mediator.Send(new InviteCandidateTestCommand(app.Id), cancellationToken);
                        }
                    }
                }
                catch { }
            }
        }
        else
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<bool>.Ok(true);
    }
}
