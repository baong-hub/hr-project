using HR.Application.Companies.Dtos;
using MediatR;

namespace HR.Application.Companies.Commands.FollowCompany;

public record FollowCompanyCommand(int CompanyId) : IRequest<FollowResultDto>;
