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
    string VisibilityStatus,
    string? ExperienceSummary = null,
    string? CurrentPosition = null,
    string? CurrentCompany = null,
    int TotalYearsExperience = 0,
    string? Location = null,
    string? DefaultCvUrl = null,
    string? DefaultCvTitle = null,
    string? Email = null,
    string? PhoneNumber = null
);
