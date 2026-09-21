using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Subscriptions.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Subscriptions.Queries.GetCurrentSubscription;

public record GetCurrentSubscriptionQuery : IRequest<CompanySubscriptionStatusDto>;

public class GetCurrentSubscriptionQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<GetCurrentSubscriptionQuery, CompanySubscriptionStatusDto>
{
    public async Task<CompanySubscriptionStatusDto> Handle(GetCurrentSubscriptionQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        var employer = await context.Employers
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.DeletedAt == null, cancellationToken);

        if (employer == null)
        {
            throw new NotFoundException("EMPLOYER_NOT_FOUND", "Không tìm thấy thông tin nhà tuyển dụng liên kết với tài khoản này.");
        }

        if (!employer.CompanyId.HasValue)
        {
            throw new BadRequestException("COMPANY_REQUIRED", "Tài khoản tuyển dụng chưa được liên kết với hồ sơ doanh nghiệp.");
        }

        var companyId = employer.CompanyId.Value;
        var sub = await context.CompanySubscriptions
            .Include(s => s.Company)
            .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.DeletedAt == null, cancellationToken);

        if (sub == null)
        {
            // Tự động khởi tạo gói FREE mặc định
            sub = new CompanySubscription
            {
                CompanyId = companyId,
                PlanName = SubscriptionPlan.FREE,
                MaxJobs = 3,
                MaxCvViews = 10,
                MaxRecruiters = 1,
                AiScreening = false,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddYears(1)
            };
            context.CompanySubscriptions.Add(sub);
            await context.SaveChangesAsync(cancellationToken);
        }

        var activeJobCount = await context.Jobs
            .CountAsync(j => j.CompanyId == companyId && j.Status == JobStatus.PUBLISHED && j.DeletedAt == null, cancellationToken);

        var isExpired = sub.EndDate < DateTime.UtcNow;
        var daysRemaining = isExpired ? 0 : (int)(sub.EndDate - DateTime.UtcNow).TotalDays;

        return new CompanySubscriptionStatusDto
        {
            Id = sub.Id,
            CompanyId = sub.CompanyId,
            CompanyName = employer.Company?.Name ?? "Doanh nghiệp",
            PlanName = sub.PlanName,
            MaxJobs = sub.MaxJobs,
            CurrentJobCount = activeJobCount,
            MaxCvViews = sub.MaxCvViews,
            MaxRecruiters = sub.MaxRecruiters,
            AiScreening = sub.AiScreening,
            StartDate = sub.StartDate,
            EndDate = sub.EndDate,
            IsActive = !isExpired,
            DaysRemaining = daysRemaining
        };
    }
}
