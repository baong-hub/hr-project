using System;

namespace HR.Application.Applications;

public record ApplicationDto(
    int Id,
    int JobId,
    string JobTitle,
    string CompanyName,
    int CandidateId,
    string CandidateName,
    string CandidateEmail,
    int CandidateCvId,
    string CvTitle,
    string CvFileUrl,
    string? CoverLetter,
    string Status,
    DateTime AppliedAt,
    int MatchScore
);

public record ChangeApplicationStatusDto(string Status);
