using MediatR;
using HR.Application.Common.Models;
using HR.Application.Jobs.Dtos;

namespace HR.Application.Jobs.Queries.GetJobs;

public record GetJobsQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Q = null,
    string? City = null,
    string? Provinces = null,
    string? Province = null,
    string? Categories = null,
    string? Category = null,
    string? Industry = null,
    string? WorkMode = null,
    string? Mode = null,
    string? EmploymentType = null,
    string? Type = null,
    string? ExperienceLevel = null,
    string? Level = null,
    decimal? SalaryFrom = null,
    decimal? SalaryTo = null,
    string? Salary = null,
    int? PostedWithinDays = null,
    string? Posted = null,
    bool? IsFeatured = null,
    bool? IsUrgent = null,
    string? Status = null,
    string? Sort = "newest"
) : IRequest<PagedResult<JobDto>>;
