using System.Collections.Generic;
using HR.Application.Cvs.Dtos;
using MediatR;

namespace HR.Application.Cvs.Queries.SearchCandidates;

public record SearchCandidatesQuery(
    int Page = 1,
    int PageSize = 10,
    string? Skill = null,
    string? Search = null
) : IRequest<List<CandidateProfileDto>>;
