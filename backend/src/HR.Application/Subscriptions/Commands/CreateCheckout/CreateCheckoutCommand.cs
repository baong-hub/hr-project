using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Subscriptions.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Subscriptions.Commands.CreateCheckout;

public record CreateCheckoutCommand(CreateCheckoutRequest Request) : IRequest<CheckoutResultDto>;

public class CreateCheckoutCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<CreateCheckoutCommand, CheckoutResultDto>
{
    public async Task<CheckoutResultDto> Handle(CreateCheckoutCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var userId = currentUserService.UserId;
        var employer = await context.Employers
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.DeletedAt == null, cancellationToken);

        if (employer == null || !employer.CompanyId.HasValue || employer.Company == null)
        {
            throw new BadRequestException("COMPANY_REQUIRED", "Tài khoản nhà tuyển dụng chưa được liên kết với hồ sơ doanh nghiệp.");
        }

        decimal monthlyPrice = request.Plan switch
        {
            SubscriptionPlan.PRO => 1990000,
            SubscriptionPlan.BUSINESS => 4990000,
            SubscriptionPlan.ENTERPRISE => 9990000,
            _ => throw new BadRequestException("INVALID_PLAN", "Gói miễn phí không cần thanh toán.")
        };

        var months = Math.Max(1, request.Months);
        var totalAmount = monthlyPrice * months;
        var orderId = $"HR_SUB_{employer.CompanyId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}_{request.Plan}";

        // Tích hợp chuẩn VietQR & Cổng thanh toán trực tuyến
        var bankBin = "970422"; // MBBank NAPAS BIN
        var accountNumber = "0888999999";
        var accountName = "HR RECRUITMENT PORTAL";
        var description = $"Thanh toan goi {request.Plan} cong ty {employer.Company.Name}";
        if (description.Length > 50) description = description.Substring(0, 50);

        var qrCodeUrl = $"https://img.vietqr.io/image/{bankBin}-{accountNumber}-compact2.png?amount={totalAmount}&addInfo={Uri.EscapeDataString(orderId)}&accountName={Uri.EscapeDataString(accountName)}";
        var paymentUrl = $"http://localhost:5173/employer/subscription/payment-gateway?orderId={orderId}&amount={totalAmount}&plan={request.Plan}&qr={Uri.EscapeDataString(qrCodeUrl)}";

        return new CheckoutResultDto
        {
            OrderId = orderId,
            AmountVnd = totalAmount,
            PaymentUrl = paymentUrl,
            QrCodeUrl = qrCodeUrl,
            Description = description,
            ExpireAt = DateTime.UtcNow.AddMinutes(30)
        };
    }
}
