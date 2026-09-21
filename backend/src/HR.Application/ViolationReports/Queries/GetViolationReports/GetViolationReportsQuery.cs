using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.ViolationReports.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.ViolationReports.Queries.GetViolationReports;

public record GetViolationReportsQuery(
    ViolationStatus? Status = null,
    int Page = 1,
    int PageSize = 20) : IRequest<PaginatedResult<ViolationReportDto>>;

public class GetViolationReportsQueryHandler(IApplicationDbContext context) : IRequestHandler<GetViolationReportsQuery, PaginatedResult<ViolationReportDto>>
{
    public async Task<PaginatedResult<ViolationReportDto>> Handle(GetViolationReportsQuery request, CancellationToken cancellationToken)
    {
        var query = context.ViolationReports
            .Include(r => r.Reporter)
                .ThenInclude(c => c.User)
            .Include(r => r.ResolvedBy)
            .Where(r => r.DeletedAt == null);

        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : request.PageSize;

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // Preload titles
        var jobIds = items.Where(i => i.TargetType == ViolationTargetType.JOB).Select(i => i.TargetId).Distinct().ToList();
        var companyIds = items.Where(i => i.TargetType == ViolationTargetType.COMPANY).Select(i => i.TargetId).Distinct().ToList();

        var jobMap = await context.Jobs.Where(j => jobIds.Contains(j.Id)).ToDictionaryAsync(j => j.Id, j => j.Title, cancellationToken);
        var companyMap = await context.Companies.Where(c => companyIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);

        var dtos = items.Select(r =>
        {
            string targetTitle = r.TargetType == ViolationTargetType.JOB
                ? jobMap.GetValueOrDefault(r.TargetId, $"Tin tuyển dụng #{r.TargetId}")
                : companyMap.GetValueOrDefault(r.TargetId, $"Doanh nghiệp #{r.TargetId}");

            return new ViolationReportDto
            {
                Id = r.Id,
                ReporterId = r.ReporterId,
                ReporterName = r.Reporter?.FullName ?? r.Reporter?.User?.FullName ?? "Ứng viên",
                TargetType = r.TargetType,
                TargetId = r.TargetId,
                TargetTitle = targetTitle,
                Reason = r.Reason,
                Description = r.Description,
                Status = r.Status,
                Resolution = r.Resolution,
                ResolvedById = r.ResolvedById,
                ResolvedByName = r.ResolvedBy?.FullName ?? r.ResolvedBy?.Username,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            };
        }).ToList();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PaginatedResult<ViolationReportDto>(dtos, totalCount, totalPages, page, pageSize);
    }
}
