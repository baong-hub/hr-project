using System.Collections.Generic;
using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.Subscriptions.Commands.CreateCheckout;
using HR.Application.Subscriptions.Commands.HandlePaymentWebhook;
using HR.Application.Subscriptions.Dtos;
using HR.Application.Subscriptions.Queries.GetAvailablePlans;
using HR.Application.Subscriptions.Queries.GetCurrentSubscription;
using HR.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/subscriptions")]
public class SubscriptionsController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Danh sách tất cả các gói dịch vụ tuyển dụng và bảng giá
    /// </summary>
    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans()
    {
        var result = await mediator.Send(new GetAvailablePlansQuery());
        return Ok(ApiResponse<List<SubscriptionPlanDetailDto>>.Ok(result));
    }

    /// <summary>
    /// Lấy thông tin gói dịch vụ hiện tại của doanh nghiệp
    /// </summary>
    [HttpGet("current")]
    [Authorize]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> GetCurrentSubscription()
    {
        var result = await mediator.Send(new GetCurrentSubscriptionQuery());
        return Ok(ApiResponse<CompanySubscriptionStatusDto>.Ok(result));
    }

    /// <summary>
    /// Tạo yêu cầu thanh toán nâng cấp gói dịch vụ (sinh mã VietQR / Checkout URL)
    /// </summary>
    [HttpPost("checkout")]
    [Authorize]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> CreateCheckout([FromBody] CreateCheckoutRequest request)
    {
        var result = await mediator.Send(new CreateCheckoutCommand(request));
        return Ok(ApiResponse<CheckoutResultDto>.Ok(result));
    }

    /// <summary>
    /// Webhook IPN nhận kết quả thanh toán từ cổng thanh toán trực tuyến
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> PaymentWebhook([FromBody] PaymentWebhookRequest request)
    {
        var secretHeader = Request.Headers["X-Webhook-Secret"].ToString();
        var result = await mediator.Send(new HandlePaymentWebhookCommand(request, string.IsNullOrWhiteSpace(secretHeader) ? null : secretHeader));
        return Ok(new { success = result, message = result ? "Giao dịch xử lý thành công." : "Giao dịch bị từ chối." });
    }
}
