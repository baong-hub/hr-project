using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.JobOffers.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.JobOffers.Queries.GetJobOffersByCandidate;

public record GetJobOffersByCandidateQuery(JobOfferStatus? Status = null) : IRequest<List<JobOfferDto>>;

public class GetJobOffersByCandidateQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<GetJobOffersByCandidateQuery, List<JobOfferDto>>
{
    public async Task<List<JobOfferDto>> Handle(GetJobOffersByCandidateQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;

        var query = context.JobOffers
            .Include(o => o.Job)
                .ThenInclude(j => j.Company)
            .Include(o => o.Candidate)
                .ThenInclude(c => c.User)
            .Where(o => o.CandidateId == userId)
            .AsNoTracking();

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
