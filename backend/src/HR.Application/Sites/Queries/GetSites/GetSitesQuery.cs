using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Sites.Queries.GetSites;

public record SiteDto(
    int Id,
    string Code,
    string Name,
    string? Address,
    string? RegisteredName,
    string? CompanyName,
    string? CompanyDesc
);

public record GetSitesQuery : IRequest<ApiResponse<List<SiteDto>>>;

public class GetSitesHandler : IRequestHandler<GetSitesQuery, ApiResponse<List<SiteDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetSitesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<SiteDto>>> Handle(GetSitesQuery request, CancellationToken cancellationToken)
    {
        var sites = await _context.Sites
            .Where(x => x.IsActive)
            .OrderBy(x => x.Id)
            .Select(x => new SiteDto(
                x.Id,
                x.Code,
                x.Name,
                x.Address,
                x.RegisteredName,
                x.Company.Name,
                x.Company.Description
            ))
            .ToListAsync(cancellationToken);

        return ApiResponse<List<SiteDto>>.Ok(sites);
    }
}

