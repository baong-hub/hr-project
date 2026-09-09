using System;
using HR.Domain.Enums;

namespace HR.Application.Interviews;

/// <summary>
/// Response DTO — API contract section 4.1
/// </summary>
public record InterviewDto(
    int Id,
    int ApplicationId,
    string JobTitle,
    string CandidateName,
    string CandidateEmail,
    string CompanyName,
    DateTime StartTime,
    DateTime EndTime,
    string InterviewType,
    string LocationOrLink,
    string? Notes,
    string Status
);

public record ScheduleInterviewDto(
    int ApplicationId,
    DateTime StartTime,
    DateTime? EndTime = null,
    string? InterviewType = "ONLINE",
    string? LocationOrLink = "",
    string? Notes = null,
    // Flexible aliases
    DateTime? ScheduledAt = null,
    string? Location = null,
    string? MeetingLink = null
);

/// <summary>
/// Request body — EP-04: Respond to interview invitation (API contract section 3.2)
/// </summary>
public record RespondInterviewDto(
    bool Accept,
    string? Reason
);

/// <summary>
/// Request body — Update interview status flexibly
/// </summary>
public record UpdateInterviewStatusDto(
    string Status,
    string? Reason = null
);

/// <summary>
/// Interview Evaluation DTOs
/// </summary>
public record InterviewEvaluationDto(
    int Id,
    int InterviewId,
    decimal TechnicalScore,
    decimal CommunicationScore,
    decimal ProblemSolvingScore,
    decimal ExperienceScore,
    decimal CultureFitScore,
    decimal SalaryExpectationScore,
    decimal OverallScore,
    string Result,
    string? Comments,
    DateTime CreatedAt
);

public record CreateInterviewEvaluationDto(
    decimal TechnicalScore,
    decimal CommunicationScore,
    decimal ProblemSolvingScore,
    decimal ExperienceScore,
    decimal CultureFitScore,
    decimal SalaryExpectationScore,
    string Result,
    string? Comments
);
