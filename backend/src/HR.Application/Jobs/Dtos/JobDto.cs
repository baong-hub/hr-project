using System;

namespace HR.Application.Jobs.Dtos;

public record JobDto(
    int Id,
    int EmployerId,
    string CompanyName,
    string? CompanyLogoUrl,
    string Title,
    string Description,
    string Requirements,
    string? Benefits,
    decimal? SalaryFrom,
    decimal? SalaryTo,
    string City,
    string Status,
    DateTime ExpiredAt,
    DateTime CreatedAt,
    bool IsFeatured = false,
    DateTime? FeaturedUntil = null,
    bool IsUrgent = false,
    DateTime? UrgentUntil = null,
    int RiskScore = 0,
    string? FraudWarningFlags = null,
    string ModerationStatus = "APPROVED"
);
