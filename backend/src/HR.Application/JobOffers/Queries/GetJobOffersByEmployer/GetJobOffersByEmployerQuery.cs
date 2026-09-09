using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.JobOffers.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.JobOffers.Queries.GetJobOffersByEmployer;

public record GetJobOffersByEmployerQuery(
    int? JobId = null,
    JobOfferStatus? Status = null) : IRequest<List<JobOfferDto>>;

public class GetJobOffersByEmployerQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<GetJobOffersByEmployerQuery, List<JobOfferDto>>
{
    public async Task<List<JobOfferDto>> Handle(GetJobOffersByEmployerQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        var employer = await context.Employers
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

        var query = context.JobOffers
            .Include(o => o.Job)
                .ThenInclude(j => j.Company)
            .Include(o => o.Candidate)
                .ThenInclude(c => c.User)
            .AsNoTracking();

        if (employer?.CompanyId != null)
        {
            query = query.Where(o => o.Job.CompanyId == employer.CompanyId);
        }
        else if (!currentUserService.IsSuperAdmin)
        {
            query = query.Where(o => o.CreatedByEmployerId == (employer != null ? employer.Id : -1));
        }

        if (request.JobId.HasValue)
        {
            query = query.Where(o => o.JobId == request.JobId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(o => o.Status == request.Status.Value);
        }

        var offers = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return offers.Select(JobOfferDto.FromEntity).ToList();
    }
}
