using System;

namespace HR.Application.Cvs.Dtos;

public record CandidateCvDto(
    int Id,
    int CandidateId,
    string CvTitle,
    string? FileUrl,
    bool IsDefault,
    long? FileSizeBytes,
    string CvType,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
