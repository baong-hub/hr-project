using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Companies.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Companies.Queries.GetCompanyById;

public class GetCompanyByIdHandler : IRequestHandler<GetCompanyByIdQuery, CompanyDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCompanyByIdHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CompanyDto> Handle(GetCompanyByIdQuery request, CancellationToken cancellationToken)
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (company == null)
        {
            throw new NotFoundException("COMPANY_NOT_FOUND", "Doanh nghiệp không tồn tại.");
        }

        var followersCount = await _context.CandidateFollows
            .CountAsync(cf => cf.CompanyId == company.Id, cancellationToken);

        bool? isFollowing = null;
        var userId = _currentUserService.UserId;
        if (userId != 0)
        {
            isFollowing = await _context.CandidateFollows
                .AnyAsync(cf => cf.CandidateId == userId && cf.CompanyId == company.Id, cancellationToken);
        }

        return new CompanyDto(
            company.Id,
            company.Name,
            company.LogoUrl,
            company.BannerUrl,
            company.TaxCode,
            company.Website,
            company.Industry,
            company.SizeRange,
            company.FoundedYear,
            company.Address,
            company.Description,
            company.Benefits,
            company.Contact,
            company.SocialLinks,
            company.VerificationStatus.ToString(),
            followersCount,
            isFollowing
        );
    }
}
