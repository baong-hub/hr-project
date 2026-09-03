using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Cvs.Commands.DeleteCv;

public class DeleteCvHandler : IRequestHandler<DeleteCvCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteCvHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteCvCommand request, CancellationToken cancellationToken)
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

        // Quyền xóa: Ứng viên sở hữu CV hoặc Admin
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        bool isAdmin = user?.Role?.Name == "ADMIN";

        if (cv.Candidate.UserId != userId && !isAdmin)
        {
            throw new ForbiddenException("CV_FORBIDDEN_DELETE", "Bạn không có quyền xóa CV này.");
        }

        // Thực hiện Soft Delete
        cv.DeletedAt = DateTime.Now;
        cv.DeletedBy = userId;
        _context.CandidateCvs.Update(cv);

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
