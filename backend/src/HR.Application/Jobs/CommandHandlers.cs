using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs;

public class UpdateJobCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<UpdateJobCommand, bool>
{
    public async Task<bool> Handle(UpdateJobCommand request, CancellationToken cancellationToken)
    {
        var job = await context.Jobs.FirstOrDefaultAsync(j => j.Id == request.Id, cancellationToken);
        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Không tìm thấy tin tuyển dụng yêu cầu.");
        }

        // Authorization check: only job owner or super admin can edit
        var userId = currentUserService.UserId;
        var employer = await context.Employers.FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
        var isAdmin = currentUserService.Username == "admin";

        if (!isAdmin && (employer == null || job.EmployerId != employer.Id))
        {
            throw new ForbiddenException("JOB_FORBIDDEN_MODIFICATION", "Bạn không có quyền sửa tin tuyển dụng này.");
        }

        job.Title = request.Title;
        job.Description = request.Description;
        job.Requirements = request.Requirements;
        job.Benefits = request.Benefits;
        job.SalaryFrom = request.SalaryFrom;
        job.SalaryTo = request.SalaryTo;
        job.City = request.City;
        job.ExpiredAt = request.ExpiredAt;

        if (!string.IsNullOrWhiteSpace(request.Department)) job.Department = request.Department;
        if (!string.IsNullOrWhiteSpace(request.Category)) job.Category = request.Category;
        if (!string.IsNullOrWhiteSpace(request.EmploymentType)) job.EmploymentType = request.EmploymentType;
        if (!string.IsNullOrWhiteSpace(request.District)) job.District = request.District;
        if (!string.IsNullOrWhiteSpace(request.Office)) job.Office = request.Office;
        if (!string.IsNullOrWhiteSpace(request.Country)) job.Country = request.Country;
        if (!string.IsNullOrWhiteSpace(request.ExperienceLevel)) job.ExperienceLevel = request.ExperienceLevel;
        if (request.ExperienceYearsMin.HasValue) job.ExperienceYearsMin = request.ExperienceYearsMin;
        if (!string.IsNullOrWhiteSpace(request.Education)) job.Education = request.Education;
        if (!string.IsNullOrWhiteSpace(request.ProbationDuration)) job.ProbationDuration = request.ProbationDuration;
        if (request.Openings.HasValue && request.Openings.Value > 0) job.Openings = request.Openings.Value;

        if (!string.IsNullOrWhiteSpace(request.WorkMode) && Enum.TryParse<HR.Domain.Enums.WorkMode>(request.WorkMode, true, out var wm))
        {
            job.WorkMode = wm;
        }

        if (!string.IsNullOrWhiteSpace(request.SalaryType) && Enum.TryParse<HR.Domain.Enums.SalaryType>(request.SalaryType, true, out var st))
        {
            job.SalaryType = st;
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class DeleteJobCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<DeleteJobCommand, bool>
{
    public async Task<bool> Handle(DeleteJobCommand request, CancellationToken cancellationToken)
    {
        var job = await context.Jobs.FirstOrDefaultAsync(j => j.Id == request.Id, cancellationToken);
        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Không tìm thấy tin tuyển dụng yêu cầu.");
        }

        var userId = currentUserService.UserId;
        var employer = await context.Employers.FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
        var isAdmin = currentUserService.Username == "admin";

        if (!isAdmin && (employer == null || job.EmployerId != employer.Id))
        {
            throw new ForbiddenException("JOB_FORBIDDEN_MODIFICATION", "Bạn không có quyền xóa tin tuyển dụng này.");
        }

        context.Jobs.Remove(job);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
