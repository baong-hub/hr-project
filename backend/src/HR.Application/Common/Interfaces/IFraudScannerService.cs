using System.Collections.Generic;

namespace HR.Application.Common.Interfaces;

public class FraudScanResult
{
    public int RiskScore { get; set; } // 0 - 100
    public List<string> DetectedFlags { get; set; } = new();
    public bool IsHighRisk => RiskScore >= 50;
    public string Recommendation { get; set; } = "APPROVED"; // "APPROVED" | "FLAG_FOR_REVIEW" | "REJECT_IMMEDIATE"
    public string Summary { get; set; } = string.Empty;
}

public interface IFraudScannerService
{
    FraudScanResult ScanJob(
        string title,
        string description,
        string requirements,
        string? benefits,
        decimal? salaryFrom,
        decimal? salaryTo,
        string? experienceLevel);
}
