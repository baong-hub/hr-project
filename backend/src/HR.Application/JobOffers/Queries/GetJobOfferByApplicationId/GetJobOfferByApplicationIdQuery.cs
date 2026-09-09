using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.JobOffers.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.JobOffers.Queries.GetJobOfferByApplicationId;

public record GetJobOfferByApplicationIdQuery(int ApplicationId) : IRequest<JobOfferDto?>;

public class GetJobOfferByApplicationIdQueryHandler(IApplicationDbContext context) : IRequestHandler<GetJobOfferByApplicationIdQuery, JobOfferDto?>
{
    public async Task<JobOfferDto?> Handle(GetJobOfferByApplicationIdQuery request, CancellationToken cancellationToken)
    {
        var offer = await context.JobOffers
            .Include(o => o.Job)
                .ThenInclude(j => j.Company)
            .Include(o => o.Candidate)
                .ThenInclude(c => c.User)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(o => o.ApplicationId == request.ApplicationId, cancellationToken);

        return offer == null ? null : JobOfferDto.FromEntity(offer);
    }
}
