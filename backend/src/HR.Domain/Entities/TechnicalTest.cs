using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class TechnicalTest : BaseEntity
{
    public int ApplicationId { get; set; }
    public TechnicalTestType TestType { get; set; }
    public int DurationMinutes { get; set; }
    public int Score { get; set; } = 0;
    public TechnicalTestStatus Status { get; set; } = TechnicalTestStatus.FAILED;
    public string? Notes { get; set; }

    // Navigation
    public Application Application { get; set; } = null!;
}
