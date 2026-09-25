using MediatR;
using System;
using HR.Application.Jobs.Dtos;

namespace HR.Application.Jobs.Commands.CreateJob;

public record CreateJobCommand(
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
    string? Country = "VIETNAM",
    string? District = null,
    string? Office = null,
    string? WorkMode = null,
    string? SalaryType = null,
    string? ExperienceLevel = null,
    int? ExperienceYearsMin = null,
    string? Education = null,
    string? ProbationDuration = null,
    int? Openings = 1
) : IRequest<JobDto>;
