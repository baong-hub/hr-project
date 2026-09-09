using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.JobOffers.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.JobOffers.Commands.CancelJobOffer;

public record CancelJobOfferCommand(int OfferId, string? Reason = null) : IRequest<JobOfferDto>;

public class CancelJobOfferCommandHandler(
    IApplicationDbContext context,
    INotificationSender notificationSender) : IRequestHandler<CancelJobOfferCommand, JobOfferDto>
{
    public async Task<JobOfferDto> Handle(CancelJobOfferCommand command, CancellationToken cancellationToken)
    {
        var offer = await context.JobOffers
            .Include(o => o.Application)
            .Include(o => o.Job)
                .ThenInclude(j => j.Company)
            .Include(o => o.Candidate)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(o => o.Id == command.OfferId, cancellationToken);

        if (offer == null)
        {
            throw new NotFoundException("OFFER_NOT_FOUND", "Thư mời nhận việc không tồn tại.");
        }

        if (offer.Status != JobOfferStatus.PENDING && offer.Status != JobOfferStatus.NEGOTIATING)
        {
            throw new BadRequestException("CANNOT_CANCEL", "Chỉ có thể thu hồi thư mời đang chờ phản hồi hoặc đang thương lượng.");
        }

        offer.Status = JobOfferStatus.CANCELLED;
        offer.Notes = string.IsNullOrWhiteSpace(command.Reason) 
            ? offer.Notes 
            : $"{offer.Notes}\n[Lý do thu hồi: {command.Reason.Trim()}]".Trim();
        offer.UpdatedAt = DateTime.Now;

        // Hoàn lại trạng thái Application về INTERVIEW
        offer.Application.Status = ApplicationStatus.INTERVIEW;
        offer.Application.UpdatedAt = DateTime.Now;

        await context.SaveChangesAsync(cancellationToken);

        // Báo cho ứng viên nếu cần
        if (offer.Candidate.UserId > 0)
        {
            await notificationSender.SendNotificationAsync(
                offer.Candidate.UserId,
                "⚠️ Thư mời nhận việc đã được thu hồi",
                $"Công ty {offer.Job.Company?.Name} đã thu hồi Thư mời nhận việc cho vị trí {offer.PositionTitle}.",
                NotificationType.OFFER_DECLINED,
                $"/candidate/applications",
                cancellationToken);
        }

        return JobOfferDto.FromEntity(offer);
    }
}
