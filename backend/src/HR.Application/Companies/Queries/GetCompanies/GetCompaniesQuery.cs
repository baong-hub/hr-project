using HR.Application.Common.Models;
using HR.Application.Companies.Dtos;
using MediatR;

namespace HR.Application.Companies.Queries.GetCompanies;

public record GetCompaniesQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Industry = null
) : IRequest<PagedResult<CompanyDto>>;
