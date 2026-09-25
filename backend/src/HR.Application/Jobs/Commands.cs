using System;
using MediatR;

namespace HR.Application.Jobs;

public record UpdateJobCommand(
    int Id,
    string Title,
    string Description,
    string Requirements,
    string? Benefits,
    decimal? SalaryFrom,
    decimal? SalaryTo,
    string City,
    DateTime ExpiredAt,
    string? Department = null,
    string? Category = null,
    string? EmploymentType = null,
    string? Country = null,
    string? District = null,
    string? Office = null,
    string? WorkMode = null,
    string? SalaryType = null,
    string? ExperienceLevel = null,
    int? ExperienceYearsMin = null,
    string? Education = null,
    string? ProbationDuration = null,
    int? Openings = null
) : IRequest<bool>;

public record DeleteJobCommand(int Id) : IRequest<bool>;
