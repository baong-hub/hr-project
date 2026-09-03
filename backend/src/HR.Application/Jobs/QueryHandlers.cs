using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Jobs.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs;

public class GetJobByIdQueryHandler(IApplicationDbContext context) 
    : IRequestHandler<GetJobByIdQuery, JobDto?>
{
    public async Task<JobDto?> Handle(GetJobByIdQuery request, CancellationToken cancellationToken)
    {
        var j = await context.Jobs
            .Include(j => j.Company)
            .Include(j => j.Employer)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (j == null) return null;

        return new JobDto(
            j.Id,
            j.EmployerId,
            j.Company?.Name ?? "Hệ thống HR",
            j.Company?.LogoUrl,
            j.Title,
            j.Description,
            j.Requirements,
            j.Benefits,
            j.SalaryFrom,
            j.SalaryTo,
            j.City,
            j.Status.ToString(),
            j.ExpiredAt,
            j.CreatedAt
        );
    }
}
