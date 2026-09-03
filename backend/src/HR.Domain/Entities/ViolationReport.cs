using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class ViolationReport : BaseEntity
{
    public int ReporterId { get; set; }
    public ViolationTargetType TargetType { get; set; }
    public int TargetId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ViolationStatus Status { get; set; } = ViolationStatus.PENDING;
    public string? Resolution { get; set; }
    public int? ResolvedById { get; set; }

    // Navigation properties
    public Candidate Reporter { get; set; } = null!;
    public User? ResolvedBy { get; set; }
}
