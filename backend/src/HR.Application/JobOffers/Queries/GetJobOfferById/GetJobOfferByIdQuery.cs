using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.JobOffers.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.JobOffers.Queries.GetJobOfferById;

public record GetJobOfferByIdQuery(int Id) : IRequest<JobOfferDto>;

public class GetJobOfferByIdQueryHandler(IApplicationDbContext context) : IRequestHandler<GetJobOfferByIdQuery, JobOfferDto>
{
    public async Task<JobOfferDto> Handle(GetJobOfferByIdQuery request, CancellationToken cancellationToken)
    {
        var offer = await context.JobOffers
            .Include(o => o.Job)
                .ThenInclude(j => j.Company)
            .Include(o => o.Candidate)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);

        if (offer == null)
        {
            throw new NotFoundException("OFFER_NOT_FOUND", "Thư mời nhận việc không tồn tại.");
        }

        return JobOfferDto.FromEntity(offer);
    }
}
