using MediatR;
using HR.Application.Common.Models;
using HR.Application.Jobs.Dtos;

namespace HR.Application.Jobs.Queries.GetJobs;

public record GetJobsQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? City = null,
    decimal? SalaryFrom = null,
    string? Status = null
) : IRequest<PagedResult<JobDto>>;
