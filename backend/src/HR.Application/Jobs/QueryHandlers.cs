using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Jobs.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs;

public class GetJobByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService) 
    : IRequestHandler<GetJobByIdQuery, JobDto?>
{
    public async Task<JobDto?> Handle(GetJobByIdQuery request, CancellationToken cancellationToken)
    {
        var j = await context.Jobs
            .Include(j => j.Company)
            .Include(j => j.Employer)
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.DeletedAt == null, cancellationToken);

        if (j == null) return null;



        var now = DateTime.UtcNow;
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
            j.CreatedAt,
            j.IsFeatured && (j.FeaturedUntil == null || j.FeaturedUntil > now),
            j.FeaturedUntil,
            j.IsUrgent && (j.UrgentUntil == null || j.UrgentUntil > now),
            j.UrgentUntil,
            j.RiskScore,
            j.FraudWarningFlags,
            j.ModerationStatus,
            j.CompanyId,
            j.Department,
            j.Category,
            j.EmploymentType,
            j.Country,
            j.District,
            j.Office,
            j.WorkMode.ToString(),
            j.SalaryType.ToString(),
            j.ExperienceLevel,
            j.ExperienceYearsMin,
            j.Education,
            j.ProbationDuration,
            j.Openings,
            j.HiredCount
        );
    }
}
