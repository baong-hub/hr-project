using System;
using System.Collections.Generic;

namespace HR.Application.Cvs.Dtos;

public record CandidateProfileDto(
    int Id,
    string FullName,
    string? AvatarUrl,
    string? Gender,
    DateTime? BirthDate,
    string? Objective,
    List<string> Skills,
    string VisibilityStatus
);
