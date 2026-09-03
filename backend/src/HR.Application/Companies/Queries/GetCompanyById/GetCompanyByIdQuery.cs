using HR.Application.Companies.Dtos;
using MediatR;

namespace HR.Application.Companies.Queries.GetCompanyById;

public record GetCompanyByIdQuery(int Id) : IRequest<CompanyDto>;
