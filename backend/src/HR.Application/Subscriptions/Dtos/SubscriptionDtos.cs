using System;
using System.Collections.Generic;
using HR.Domain.Enums;

namespace HR.Application.Subscriptions.Dtos;

public class SubscriptionPlanDetailDto
{
    public SubscriptionPlan Plan { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal MonthlyPriceVnd { get; set; }
    public int MaxJobs { get; set; }
    public int MaxCvViews { get; set; }
    public int MaxRecruiters { get; set; }
    public bool AiScreening { get; set; }
    public List<string> Highlights { get; set; } = [];
}

public class CompanySubscriptionStatusDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public SubscriptionPlan PlanName { get; set; }
    public int MaxJobs { get; set; }
    public int CurrentJobCount { get; set; }
    public int MaxCvViews { get; set; }
    public int MaxRecruiters { get; set; }
    public bool AiScreening { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public int DaysRemaining { get; set; }
}

public class CreateCheckoutRequest
{
    public SubscriptionPlan Plan { get; set; } = SubscriptionPlan.PRO;
    public int Months { get; set; } = 1;
    public string? ReturnUrl { get; set; }
}

public class CheckoutResultDto
{
    public string OrderId { get; set; } = string.Empty;
    public decimal AmountVnd { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
    public string QrCodeUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ExpireAt { get; set; }
}

public class PaymentWebhookRequest
{
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "PAID"; // PAID, CANCELLED, FAILED
    public string Signature { get; set; } = string.Empty;
}
