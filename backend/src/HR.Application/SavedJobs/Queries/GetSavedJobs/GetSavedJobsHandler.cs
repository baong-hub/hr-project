using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Models;
using HR.Application.SavedJobs.Dtos;

namespace HR.Application.SavedJobs.Queries.GetSavedJobs;

public class GetSavedJobsHandler : IRequestHandler<GetSavedJobsQuery, PagedResult<SavedJobDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetSavedJobsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<SavedJobDto>> Handle(GetSavedJobsQuery request, CancellationToken cancellationToken)
    {
        // 1. Xác định Candidate từ UserId hiện tại
        var candidate = await _context.Candidates
            .FirstOrDefaultAsync(c => c.Id == _currentUser.UserId, cancellationToken);

        if (candidate == null)
        {
            throw new ForbiddenException("PERMISSION_DENIED", "Chỉ ứng viên mới có quyền xem danh sách việc làm đã lưu.");
        }

        // 2. Query danh sách saved jobs của ứng viên (kèm thông tin Job + Company)
        var query = _context.SavedJobs
            .Where(s => s.CandidateId == candidate.Id)
            .Join(
                _context.Jobs.IgnoreQueryFilters(), // Bao gồm cả CLOSED/EXPIRED [BR-02]
                s => s.JobId,
                j => j.Id,
                (s, j) => new { SavedJob = s, Job = j }
            )
            .Join(
                _context.Companies,
                sj => sj.Job.CompanyId,
                c => c.Id,
                (sj, c) => new { sj.SavedJob, sj.Job, Company = c }
            )
            .OrderByDescending(x => x.SavedJob.SavedAt);

        // 3. Phân trang
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new SavedJobDto(
                x.Job.Id,
                x.Job.Title,
                x.Company.Name,
                x.Company.LogoUrl,
                x.Job.SalaryFrom,
                x.Job.SalaryTo,
                x.Job.City,
                x.Job.ExpiredAt.ToString("yyyy-MM-dd"),
                x.Job.Status.ToString(),
                x.SavedJob.SavedAt.ToString("yyyy-MM-ddTHH:mm:ss")
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<SavedJobDto>
        {
            Items = items,
            Meta = new PagingMeta
            {
                Page = page,
                PageSize = pageSize,
                Total = total
            }
        };
    }
}
