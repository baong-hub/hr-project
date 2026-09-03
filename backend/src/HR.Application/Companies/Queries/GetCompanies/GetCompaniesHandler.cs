using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.Common.Interfaces;
using HR.Application.Companies.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Companies.Queries.GetCompanies;

public class GetCompaniesHandler : IRequestHandler<GetCompaniesQuery, PagedResult<CompanyDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCompaniesHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<CompanyDto>> Handle(GetCompaniesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Companies.AsNoTracking();

        // [US-02] public view only returns VERIFIED companies
        query = query.Where(c => c.VerificationStatus == CompanyVerificationStatus.VERIFIED);

        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(c => c.Name.Contains(request.Search));
        }

        if (!string.IsNullOrEmpty(request.Industry))
        {
            query = query.Where(c => c.Industry == request.Industry);
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var userId = _currentUserService.UserId;
        var companyDtos = new List<CompanyDto>();

        foreach (var company in items)
        {
            var followersCount = await _context.CandidateFollows
                .CountAsync(cf => cf.CompanyId == company.Id, cancellationToken);

            bool? isFollowing = null;
            if (userId != 0)
            {
                isFollowing = await _context.CandidateFollows
                    .AnyAsync(cf => cf.CandidateId == userId && cf.CompanyId == company.Id, cancellationToken);
            }

            companyDtos.Add(new CompanyDto(
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
            ));
        }

        return new PagedResult<CompanyDto>
        {
            Items = companyDtos,
            Meta = new PagingMeta
            {
                Page = request.Page,
                PageSize = request.PageSize,
                Total = total
            }
        };
    }
}
