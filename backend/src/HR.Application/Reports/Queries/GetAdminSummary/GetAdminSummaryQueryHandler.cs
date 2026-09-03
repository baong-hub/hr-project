using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Reports.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Reports.Queries.GetAdminSummary;

public class GetAdminSummaryQueryHandler : IRequestHandler<GetAdminSummaryQuery, AdminSummaryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAdminSummaryQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AdminSummaryDto> Handle(GetAdminSummaryQuery request, CancellationToken cancellationToken)
    {
        var isAdmin = _currentUserService.HasPermission("report:view_all");
        if (!isAdmin)
        {
            throw new ForbiddenException("Bạn không có quyền truy cập dữ liệu báo cáo hệ thống");
        }

        var totalCompanies = await _context.Companies.CountAsync(c => c.DeletedAt == null, cancellationToken);
        var totalCandidates = await _context.Candidates.CountAsync(c => c.DeletedAt == null, cancellationToken);
        var totalJobs = await _context.Jobs.CountAsync(j => j.DeletedAt == null, cancellationToken);
        var totalApplications = await _context.Applications.CountAsync(a => a.DeletedAt == null, cancellationToken);

        return new AdminSummaryDto(totalCompanies, totalCandidates, totalJobs, totalApplications);
    }
}
