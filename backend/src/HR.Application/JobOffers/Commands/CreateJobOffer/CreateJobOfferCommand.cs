using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.JobOffers.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.JobOffers.Commands.CreateJobOffer;

public record CreateJobOfferCommand(CreateJobOfferRequest Request) : IRequest<JobOfferDto>;

public class CreateJobOfferCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IEmailService emailService,
    INotificationSender notificationSender) : IRequestHandler<CreateJobOfferCommand, JobOfferDto>
{
    public async Task<JobOfferDto> Handle(CreateJobOfferCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;

        if (req.BasicSalary <= 0)
        {
            throw new BadRequestException("INVALID_SALARY", "Mức lương cơ bản phải lớn hơn 0.");
        }

        if (req.ExpiryDate <= DateTime.Now)
        {
            throw new BadRequestException("INVALID_EXPIRY_DATE", "Hạn chót phản hồi phải ở tương lai.");
        }

        if (req.StartDate <= DateTime.Now.Date)
        {
            throw new BadRequestException("INVALID_START_DATE", "Ngày dự kiến nhận việc phải lớn hơn hoặc bằng ngày hôm nay.");
        }

        // Lấy application
        var application = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(a => a.Id == req.ApplicationId, cancellationToken);

        if (application == null)
        {
            throw new NotFoundException("APPLICATION_NOT_FOUND", "Hồ sơ ứng tuyển không tồn tại.");
        }

        var employerUserId = currentUserService.UserId;
        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.UserId == employerUserId, cancellationToken);

        var employerId = employer?.Id ?? 1;

        // Huỷ bỏ các offer PENDING trước đó của application này nếu có
        var existingPendingOffers = await context.JobOffers
            .Where(o => o.ApplicationId == application.Id && o.Status == JobOfferStatus.PENDING)
            .ToListAsync(cancellationToken);

        foreach (var oldOffer in existingPendingOffers)
        {
            oldOffer.Status = JobOfferStatus.CANCELLED;
            oldOffer.UpdatedAt = DateTime.Now;
        }

        // Tạo offer mới
        var offer = new JobOffer
        {
            ApplicationId = application.Id,
            JobId = application.JobId,
            CandidateId = application.CandidateId,
            CreatedByEmployerId = employerId,
            PositionTitle = string.IsNullOrWhiteSpace(req.PositionTitle) ? application.Job.Title : req.PositionTitle.Trim(),
            DepartmentName = req.DepartmentName?.Trim(),
            WorkLocation = req.WorkLocation?.Trim() ?? application.Job.Office ?? application.Job.City,
            WorkingHours = req.WorkingHours?.Trim() ?? "Thứ 2 - Thứ 6: 08:30 - 17:30",
            BasicSalary = req.BasicSalary,
            Allowance = req.Allowance,
            SalaryType = req.SalaryType,
            Currency = string.IsNullOrWhiteSpace(req.Currency) ? "VND" : req.Currency.Trim(),
            ProbationPeriodMonths = req.ProbationPeriodMonths > 0 ? req.ProbationPeriodMonths : 2,
            ProbationSalaryPercentage = req.ProbationSalaryPercentage > 0 ? req.ProbationSalaryPercentage : 85,
            StartDate = req.StartDate,
            ExpiryDate = req.ExpiryDate,
            IssuedAt = DateTime.Now,
            Benefits = req.Benefits?.Trim(),
            SpecialTerms = req.SpecialTerms?.Trim(),
            Notes = req.Notes?.Trim(),
            OfferLetterFileUrl = req.OfferLetterFileUrl,
            OfferLetterFileName = req.OfferLetterFileName,
            Status = JobOfferStatus.PENDING
        };

        context.JobOffers.Add(offer);

        // Cập nhật trạng thái application sang OFFER
        application.Status = ApplicationStatus.OFFER;
        application.UpdatedAt = DateTime.Now;

        await context.SaveChangesAsync(cancellationToken);

        // Gửi thông báo SignalR & Email cho ứng viên
        var candidateUserId = application.Candidate.UserId;
        var candidateEmail = !string.IsNullOrWhiteSpace(req.CandidateEmail)
            ? req.CandidateEmail.Trim()
            : application.Candidate.User?.Email;
        var candidateName = application.Candidate.FullName;
        var companyName = application.Job.Company?.Name ?? "Công ty tuyển dụng";

        if (candidateUserId > 0)
        {
            await notificationSender.SendNotificationAsync(
                candidateUserId,
                "🎊 Bạn nhận được Thư Mời Nhận Việc (Job Offer)",
                $"{companyName} trân trọng gửi tới bạn đề xuất nhận việc cho vị trí {offer.PositionTitle}. Vui lòng xem và phản hồi trước {offer.ExpiryDate:dd/MM/yyyy}.",
                NotificationType.OFFER_RECEIVED,
                $"/candidate/offers/{offer.Id}",
                cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(candidateEmail))
        {
            _ = emailService.SendDetailedOfferLetterEmailAsync(
                candidateEmail,
                candidateName,
                application.Job.Title,
                companyName,
                offer.Id,
                offer.PositionTitle,
                offer.BasicSalary,
                offer.Allowance,
                offer.SalaryType.ToString(),
                offer.Currency,
                offer.ProbationPeriodMonths,
                offer.ProbationSalaryPercentage,
                offer.StartDate,
                offer.ExpiryDate,
                offer.WorkLocation,
                offer.Benefits,
                offer.OfferLetterFileUrl,
                cancellationToken);
        }

        offer.Job = application.Job;
        offer.Candidate = application.Candidate;
        return JobOfferDto.FromEntity(offer);
    }
}
