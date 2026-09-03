using HR.Application.Companies.Dtos;
using MediatR;

namespace HR.Application.Companies.Commands.UpdateCompany;

public record UpdateCompanyCommand(
    int Id,
    string Name,
    string? LogoUrl,
    string? BannerUrl,
    string? Description,
    string? Website,
    string SizeRange,
    string Industry,
    string AddressList
) : IRequest<CompanyDto>;
