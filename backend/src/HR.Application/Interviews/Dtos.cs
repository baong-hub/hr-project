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

/// <summary>
/// Request body — EP-01: Schedule interview (API contract section 3.1)
/// </summary>
public record ScheduleInterviewDto(
    int ApplicationId,
    DateTime StartTime,
    DateTime EndTime,
    string InterviewType,
    string LocationOrLink,
    string? Notes
);

/// <summary>
/// Request body — EP-04: Respond to interview invitation (API contract section 3.2)
/// </summary>
public record RespondInterviewDto(
    bool Accept,
    string? Reason
);
