using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.JobOffers.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.JobOffers.Commands.RespondJobOffer;

public record RespondJobOfferCommand(int OfferId, RespondJobOfferRequest Request) : IRequest<JobOfferDto>;

public class RespondJobOfferCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IEmailService emailService,
    INotificationSender notificationSender) : IRequestHandler<RespondJobOfferCommand, JobOfferDto>
{
    public async Task<JobOfferDto> Handle(RespondJobOfferCommand command, CancellationToken cancellationToken)
    {
        var offer = await context.JobOffers
            .Include(o => o.Application)
            .Include(o => o.Job)
                .ThenInclude(j => j.Company)
            .Include(o => o.Candidate)
                .ThenInclude(c => c.User)
            .Include(o => o.CreatedByEmployer)
                .ThenInclude(e => e.User)
            .FirstOrDefaultAsync(o => o.Id == command.OfferId, cancellationToken);

        if (offer == null)
        {
            throw new NotFoundException("OFFER_NOT_FOUND", "Thư mời nhận việc không tồn tại.");
        }

        var candidateUserId = currentUserService.UserId;
        if (candidateUserId > 0 && offer.Candidate.UserId != candidateUserId)
        {
            throw new ForbiddenException("FORBIDDEN", "Bạn không có quyền phản hồi thư mời việc này.");
        }

        if (offer.Status != JobOfferStatus.PENDING && offer.Status != JobOfferStatus.NEGOTIATING)
        {
            throw new BadRequestException("OFFER_ALREADY_RESOLVED", "Thư mời việc đã được phản hồi hoặc không còn hiệu lực.");
        }

        if (DateTime.Now > offer.ExpiryDate)
        {
            offer.Status = JobOfferStatus.EXPIRED;
            await context.SaveChangesAsync(cancellationToken);
            throw new BadRequestException("OFFER_EXPIRED", "Thư mời việc đã quá hạn phản hồi.");
        }

        var action = command.Request.Action?.Trim().ToUpper() ?? string.Empty;
        var employerUser = offer.CreatedByEmployer?.User;
        var employerEmail = employerUser?.Email;
        var employerName = employerUser?.FullName ?? "Nhà tuyển dụng";
        var companyName = offer.Job.Company?.Name ?? "Công ty";
        var candidateName = offer.Candidate.FullName;
        var jobTitle = offer.PositionTitle;

        offer.RespondedAt = DateTime.Now;

        switch (action)
        {
            case "ACCEPT":
                offer.Status = JobOfferStatus.ACCEPTED;
                offer.CandidateResponseNote = command.Request.Note?.Trim();
                offer.Application.Status = ApplicationStatus.HIRED;
                offer.Application.UpdatedAt = DateTime.Now;

                // Thông báo NTD
                if (offer.CreatedByEmployer?.UserId > 0)
                {
                    await notificationSender.SendNotificationAsync(
                        offer.CreatedByEmployer.UserId,
                        "🎉 Ứng viên ĐỒNG Ý nhận việc (Offer Accepted)!",
                        $"Ứng viên {candidateName} đã chính thức ký duyệt chấp nhận Offer cho vị trí {jobTitle}. Trạng thái hồ sơ đã chuyển sang HIRED.",
                        NotificationType.OFFER_ACCEPTED,
                        $"/employer/applications",
                        cancellationToken);
                }

                if (!string.IsNullOrWhiteSpace(employerEmail))
                {
                    _ = emailService.SendOfferResponseNotificationAsync(
                        employerEmail,
                        employerName,
                        candidateName,
                        jobTitle,
                        companyName,
                        "ACCEPT",
                        null,
                        offer.CandidateResponseNote,
                        null,
                        cancellationToken);
                }
                break;

            case "NEGOTIATE":
                offer.Status = JobOfferStatus.NEGOTIATING;
                offer.CandidateDesiredSalary = command.Request.DesiredSalary;
                offer.CandidateResponseNote = command.Request.Note?.Trim();

                // Thông báo NTD
                if (offer.CreatedByEmployer?.UserId > 0)
                {
                    var salaryNote = offer.CandidateDesiredSalary.HasValue ? $" (Mức lương mong muốn: {offer.CandidateDesiredSalary.Value:N0} VND)" : "";
                    await notificationSender.SendNotificationAsync(
                        offer.CreatedByEmployer.UserId,
                        "💬 Ứng viên ĐỀ XUẤT THƯƠNG LƯỢNG LẠI Offer",
                        $"Ứng viên {candidateName} gửi yêu cầu thương lượng cho vị trí {jobTitle}{salaryNote}: \"{offer.CandidateResponseNote}\"",
                        NotificationType.OFFER_NEGOTIATING,
                        $"/employer/applications",
                        cancellationToken);
                }

                if (!string.IsNullOrWhiteSpace(employerEmail))
                {
                    _ = emailService.SendOfferResponseNotificationAsync(
                        employerEmail,
                        employerName,
                        candidateName,
                        jobTitle,
                        companyName,
                        "NEGOTIATE",
                        offer.CandidateDesiredSalary,
                        offer.CandidateResponseNote,
                        null,
                        cancellationToken);
                }
                break;

            case "DECLINE":
                offer.Status = JobOfferStatus.DECLINED;
                offer.DeclineReason = command.Request.DeclineReason?.Trim();
                offer.CandidateResponseNote = command.Request.Note?.Trim();
                offer.Application.Status = ApplicationStatus.REJECTED;
                offer.Application.UpdatedAt = DateTime.Now;

                // Thông báo NTD
                if (offer.CreatedByEmployer?.UserId > 0)
                {
                    await notificationSender.SendNotificationAsync(
                        offer.CreatedByEmployer.UserId,
                        "❌ Ứng viên TỪ CHỐI thư mời nhận việc",
                        $"Ứng viên {candidateName} đã từ chối Offer cho vị trí {jobTitle}. Lý do: {offer.DeclineReason ?? "Lý do cá nhân"}.",
                        NotificationType.OFFER_DECLINED,
                        $"/employer/applications",
                        cancellationToken);
                }

                if (!string.IsNullOrWhiteSpace(employerEmail))
                {
                    _ = emailService.SendOfferResponseNotificationAsync(
                        employerEmail,
                        employerName,
                        candidateName,
                        jobTitle,
                        companyName,
                        "DECLINE",
                        null,
                        offer.CandidateResponseNote,
                        offer.DeclineReason,
                        cancellationToken);
                }
                break;

            default:
                throw new BadRequestException("INVALID_ACTION", "Hành động không hợp lệ. Chọn ACCEPT, NEGOTIATE hoặc DECLINE.");
        }

        await context.SaveChangesAsync(cancellationToken);

        return JobOfferDto.FromEntity(offer);
    }
}
