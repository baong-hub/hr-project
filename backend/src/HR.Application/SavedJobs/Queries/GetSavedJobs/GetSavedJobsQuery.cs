using MediatR;
using HR.Application.Common.Models;
using HR.Application.SavedJobs.Dtos;

namespace HR.Application.SavedJobs.Queries.GetSavedJobs;

public record GetSavedJobsQuery(
    int Page = 1,
    int PageSize = 10
) : IRequest<PagedResult<SavedJobDto>>;
