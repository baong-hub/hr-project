using System;
using System.Collections.Generic;

namespace HR.Application.Applications;

public record ApplicationDto(
    int Id,
    int JobId,
    string JobTitle,
    string CompanyName,
    int CandidateId,
    string CandidateName,
    string CandidateEmail,
    string? CandidateAvatarUrl,
    int CandidateCvId,
    string CvTitle,
    string CvFileUrl,
    string? CoverLetter,
    string Status,
    DateTime AppliedAt,
    DateTime? ViewedAt,
    int? MatchScore,
    string? AiSummary,
    List<string>? AiStrengths,
    List<string>? AiGaps,
    DateTime? AiEvaluatedAt,
    List<ApplicationTimelineItemDto>? Timeline
);

public record ApplicationTimelineItemDto(
    string Stage,
    string StageName,
    DateTime? AchievedAt,
    bool IsCompleted,
    bool IsCurrent
);

public record ChangeApplicationStatusDto(string Status);
