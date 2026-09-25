using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs.Commands.PromoteJob;

public record PromoteJobDto(
    string PackageType, // "URGENT_7_DAYS", "FEATURED_14_DAYS", "COMBO_VIP_30_DAYS"
    string? Notes = null
);

public record PromoteJobResultDto(
    int JobId,
    string PackageType,
    bool IsFeatured,
    DateTime? FeaturedUntil,
    bool IsUrgent,
    DateTime? UrgentUntil,
    string Message
);

public record PromoteJobCommand(int JobId, PromoteJobDto Dto) : IRequest<PromoteJobResultDto>;

public class PromoteJobCommandHandler : IRequestHandler<PromoteJobCommand, PromoteJobResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public PromoteJobCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PromoteJobResultDto> Handle(PromoteJobCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        var job = await _context.Jobs
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == request.JobId && j.DeletedAt == null, cancellationToken);

        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", $"Không tìm thấy tin tuyển dụng #{request.JobId}");
        }

        var employer = await _context.Employers.FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
        var isOwner = employer != null && employer.CompanyId == job.CompanyId;
        var isAdmin = _currentUserService.IsSuperAdmin || _currentUserService.Username == "admin" || _currentUserService.HasPermission("job:manage");

        if (!isOwner && !isAdmin)
        {
            throw new ForbiddenException("FORBIDDEN", "Bạn không có quyền quảng bá tin tuyển dụng này.");
        }

        var now = DateTime.UtcNow;
        var package = request.Dto.PackageType?.ToUpperInvariant() ?? "URGENT_7_DAYS";

        switch (package)
        {
            case "URGENT_7_DAYS":
                job.IsUrgent = true;
                job.UrgentUntil = (job.UrgentUntil != null && job.UrgentUntil > now)
                    ? job.UrgentUntil.Value.AddDays(7)
                    : now.AddDays(7);
                break;

            case "FEATURED_14_DAYS":
                job.IsFeatured = true;
                job.FeaturedUntil = (job.FeaturedUntil != null && job.FeaturedUntil > now)
                    ? job.FeaturedUntil.Value.AddDays(14)
                    : now.AddDays(14);
                job.PriorityOrder = Math.Max(job.PriorityOrder, 10);
                break;

            case "COMBO_VIP_30_DAYS":
            default:
                job.IsFeatured = true;
                job.FeaturedUntil = (job.FeaturedUntil != null && job.FeaturedUntil > now)
                    ? job.FeaturedUntil.Value.AddDays(30)
                    : now.AddDays(30);
                job.IsUrgent = true;
                job.UrgentUntil = (job.UrgentUntil != null && job.UrgentUntil > now)
                    ? job.UrgentUntil.Value.AddDays(30)
                    : now.AddDays(30);
                job.PriorityOrder = Math.Max(job.PriorityOrder, 50);
                break;
        }

        job.UpdatedAt = now;

        // Log activity
        _context.LogActivities.Add(new LogActivity
        {
            ModuleName = "Job",
            EntityId = job.Id,
            Action = "PROMOTE",
            UserId = userId != 0 ? userId : null,
            AfterValue = $"Package: {package}, FeaturedUntil: {job.FeaturedUntil:yyyy-MM-dd}, UrgentUntil: {job.UrgentUntil:yyyy-MM-dd}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new PromoteJobResultDto(
            job.Id,
            package,
            job.IsFeatured,
            job.FeaturedUntil,
            job.IsUrgent,
            job.UrgentUntil,
            $"Tin tuyển dụng #{job.Id} đã được nâng cấp thành công với gói {package}."
        );
    }
}
