using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class RecruitmentCampaign : BaseEntity
{
    public int CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Budget { get; set; } = 0.00m;
    public CampaignStatus Status { get; set; } = CampaignStatus.ACTIVE;

    // Navigation property
    public Company Company { get; set; } = null!;
}
