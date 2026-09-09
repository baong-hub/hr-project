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

        // Trả về tất cả các doanh nghiệp đã đăng ký đang hoạt động (không bị từ chối hoặc đình chỉ)
        query = query.Where(c => c.VerificationStatus != CompanyVerificationStatus.REJECTED 
                              && c.VerificationStatus != CompanyVerificationStatus.SUSPENDED);

        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(search) || (c.Description != null && c.Description.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(request.Industry))
        {
            var ind = request.Industry.Trim().ToLower();
            if (ind.Contains("khác") || ind == "other")
            {
                query = query.Where(c => c.Industry != null && (c.Industry.ToLower().Contains("khác") || c.Industry.ToLower().Contains("other")));
            }
            else
            {
                query = query.Where(c => c.Industry != null && (c.Industry.ToLower().Contains(ind) || ind.Contains(c.Industry.ToLower())));
            }
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
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
