using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Cvs.Commands.SetDefaultCv;

public class SetDefaultCvHandler : IRequestHandler<SetDefaultCvCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SetDefaultCvHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(SetDefaultCvCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == 0)
        {
            throw new ForbiddenException("UNAUTHORIZED", "Người dùng chưa đăng nhập.");
        }

        var cv = await _context.CandidateCvs
            .Include(c => c.Candidate)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (cv == null)
        {
            throw new NotFoundException("CV_NOT_FOUND", "Bản CV yêu cầu không tồn tại.");
        }

        if (cv.Candidate.UserId != userId)
        {
            throw new ForbiddenException("CV_FORBIDDEN_UPDATE", "Bạn không có quyền chỉnh sửa CV này.");
        }

        // Set all other CVs for this candidate to false
        var otherCvs = await _context.CandidateCvs
            .Where(c => c.CandidateId == cv.CandidateId && c.Id != cv.Id)
            .ToListAsync(cancellationToken);

        foreach (var other in otherCvs)
        {
            other.IsDefault = false;
        }

        cv.IsDefault = true;
        
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
