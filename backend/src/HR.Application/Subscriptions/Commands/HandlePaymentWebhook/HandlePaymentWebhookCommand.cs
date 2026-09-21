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

namespace HR.Application.Subscriptions.Commands.HandlePaymentWebhook;

public record HandlePaymentWebhookCommand(PaymentWebhookRequest Request) : IRequest<bool>;

public class HandlePaymentWebhookCommandHandler(
    IApplicationDbContext context,
    IEmailService emailService) : IRequestHandler<HandlePaymentWebhookCommand, bool>
{
    public async Task<bool> Handle(HandlePaymentWebhookCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;

        if (req.Status != "PAID" && req.Status != "SUCCESS")
        {
            return false;
        }

        // Parse orderId format: HR_SUB_{companyId}_{timestamp}_{plan}
        var parts = req.OrderId.Split('_');
        if (parts.Length < 5 || !int.TryParse(parts[2], out int companyId) || !Enum.TryParse<SubscriptionPlan>(parts[4], out var plan))
        {
            throw new BadRequestException("INVALID_ORDER_ID", "Mã đơn hàng không hợp lệ.");
        }

        var company = await context.Companies
            .FirstOrDefaultAsync(c => c.Id == companyId && c.DeletedAt == null, cancellationToken);

        if (company == null)
        {
            throw new NotFoundException("COMPANY_NOT_FOUND", "Doanh nghiệp không tồn tại.");
        }

        var sub = await context.CompanySubscriptions
            .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.DeletedAt == null, cancellationToken);

        int maxJobs = plan switch
        {
            SubscriptionPlan.PRO => 15,
            SubscriptionPlan.BUSINESS => 50,
            SubscriptionPlan.ENTERPRISE => 9999,
            _ => 3
        };

        int maxCv = plan switch
        {
            SubscriptionPlan.PRO => 100,
            SubscriptionPlan.BUSINESS => 500,
            SubscriptionPlan.ENTERPRISE => 2500,
            _ => 10
        };

        int maxRecruiters = plan switch
        {
            SubscriptionPlan.PRO => 5,
            SubscriptionPlan.BUSINESS => 15,
            SubscriptionPlan.ENTERPRISE => 50,
            _ => 1
        };

        bool ai = plan != SubscriptionPlan.FREE;

        if (sub == null)
        {
            sub = new CompanySubscription
            {
                CompanyId = companyId,
                PlanName = plan,
                MaxJobs = maxJobs,
                MaxCvViews = maxCv,
                MaxRecruiters = maxRecruiters,
                AiScreening = ai,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1)
            };
            context.CompanySubscriptions.Add(sub);
        }
        else
        {
            sub.PlanName = plan;
            sub.MaxJobs = maxJobs;
            sub.MaxCvViews = maxCv;
            sub.MaxRecruiters = maxRecruiters;
            sub.AiScreening = ai;

            var baseDate = sub.EndDate > DateTime.UtcNow ? sub.EndDate : DateTime.UtcNow;
            sub.EndDate = baseDate.AddMonths(1);
        }

        await context.SaveChangesAsync(cancellationToken);

        // Gửi email xác nhận thanh toán thành công
        var employer = await context.Employers
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.CompanyId == companyId && e.DeletedAt == null, cancellationToken);

        if (employer?.User?.Email != null)
        {
            var body = $@"
                <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;"">
                    <h2 style=""color: #16a34a;"">Xác Nhận Nâng Cấp Gói Dịch Vụ Thành Công</h2>
                    <p>Kính gửi <strong>{company.Name}</strong>,</p>
                    <p>Hệ thống đã nhận được thanh toán thành công cho đơn hàng <strong>{req.OrderId}</strong>.</p>
                    <p>Thông tin gói dịch vụ đã được kích hoạt:</p>
                    <ul>
                        <li>Gói dịch vụ: <strong>{plan}</strong></li>
                        <li>Số lượng tin đăng tối đa: <strong>{maxJobs} tin</strong></li>
                        <li>Số lượt xem CV ứng viên: <strong>{maxCv} lượt</strong></li>
                        <li>Thời hạn sử dụng đến: <strong>{sub.EndDate:dd/MM/yyyy}</strong></li>
                    </ul>
                    <p>Cảm ơn Quý công ty đã tin tưởng và đồng hành cùng HR Portal!</p>
                </div>";

            await emailService.SendEmailAsync(employer.User.Email, "[HR Portal] Xác nhận kích hoạt gói dịch vụ tuyển dụng", body, cancellationToken);
        }

        return true;
    }
}
