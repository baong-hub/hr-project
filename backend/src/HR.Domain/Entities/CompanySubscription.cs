using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class CompanySubscription : BaseEntity
{
    public int CompanyId { get; set; }
    public SubscriptionPlan PlanName { get; set; } = SubscriptionPlan.FREE;
    public int MaxJobs { get; set; } = 3;
    public int MaxCvViews { get; set; } = 10;
    public int MaxRecruiters { get; set; } = 1;
    public bool AiScreening { get; set; } = false;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Navigation property
    public Company Company { get; set; } = null!;
}
