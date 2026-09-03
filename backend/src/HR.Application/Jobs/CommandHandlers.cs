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
