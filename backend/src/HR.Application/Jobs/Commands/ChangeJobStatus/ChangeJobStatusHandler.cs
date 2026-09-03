using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs.Commands.ChangeJobStatus;

public class ChangeJobStatusHandler : IRequestHandler<ChangeJobStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ChangeJobStatusHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(ChangeJobStatusCommand request, CancellationToken cancellationToken)
    {
        var job = await _context.Jobs
            .FirstOrDefaultAsync(j => j.Id == request.Id, cancellationToken);

        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Không tìm thấy tin tuyển dụng yêu cầu.");
        }

        var userId = _currentUserService.UserId;
        var employer = await _context.Employers
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
        var isAdmin = _currentUserService.Username == "admin";

        // Authorization: only job owner or super admin can edit status
        if (!isAdmin && (employer == null || job.EmployerId != employer.Id))
        {
            throw new ForbiddenException("JOB_FORBIDDEN_MODIFICATION", "Bạn không có quyền thao tác trên tin tuyển dụng này.");
        }

        var newStatus = Enum.Parse<JobStatus>(request.Status, true);

        // Additional business rule validation
        if (!isAdmin && newStatus == JobStatus.PUBLISHED && job.Status == JobStatus.PENDING_REVIEW)
        {
            throw new ForbiddenException("JOB_FORBIDDEN_MODIFICATION", "Chỉ Admin mới có quyền phê duyệt tin đăng.");
        }

        job.Status = newStatus;
        job.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
