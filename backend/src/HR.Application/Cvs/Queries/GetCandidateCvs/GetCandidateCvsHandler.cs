using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Cvs.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Cvs.Queries.GetCandidateCvs;

public class GetCandidateCvsHandler : IRequestHandler<GetCandidateCvsQuery, List<CandidateCvDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCandidateCvsHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<CandidateCvDto>> Handle(GetCandidateCvsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == 0)
        {
            throw new ForbiddenException("UNAUTHORIZED", "Người dùng chưa đăng nhập.");
        }

        var candidate = await _context.Candidates
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (candidate == null)
        {
            return new List<CandidateCvDto>();
        }

        var cvs = await _context.CandidateCvs
            .Where(cv => cv.CandidateId == candidate.Id)
            .OrderByDescending(cv => cv.IsDefault)
            .ThenByDescending(cv => cv.CreatedAt)
            .ToListAsync(cancellationToken);

        return cvs.Select(cv => new CandidateCvDto(
            cv.Id,
            cv.CandidateId,
            cv.CvTitle,
            cv.FileUrl,
            cv.IsDefault,
            cv.FileSizeBytes,
            cv.CvType.ToString(),
            cv.CreatedAt,
            cv.UpdatedAt
        )).ToList();
    }
}
