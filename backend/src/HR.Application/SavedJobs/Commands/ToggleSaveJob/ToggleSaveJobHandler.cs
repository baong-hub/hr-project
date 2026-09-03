using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.SavedJobs.Dtos;
using HR.Domain.Entities;

namespace HR.Application.SavedJobs.Commands.ToggleSaveJob;

public class ToggleSaveJobHandler : IRequestHandler<ToggleSaveJobCommand, SaveToggleResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dateTime;

    public ToggleSaveJobHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTime)
    {
        _context = context;
        _currentUser = currentUser;
        _dateTime = dateTime;
    }

    public async Task<SaveToggleResultDto> Handle(ToggleSaveJobCommand request, CancellationToken cancellationToken)
    {
        // 1. Xác định Candidate từ UserId hiện tại
        var candidate = await _context.Candidates
            .FirstOrDefaultAsync(c => c.Id == _currentUser.UserId, cancellationToken);

        if (candidate == null)
        {
            throw new ForbiddenException("PERMISSION_DENIED", "Chỉ ứng viên mới có quyền lưu tin tuyển dụng.");
        }

        // 2. Kiểm tra Job tồn tại
        var jobExists = await _context.Jobs
            .AnyAsync(j => j.Id == request.JobId, cancellationToken);

        if (!jobExists)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Tin tuyển dụng không tồn tại.");
        }

        // 3. Toggle logic: Kiểm tra đã lưu hay chưa
        var existingSave = await _context.SavedJobs
            .FirstOrDefaultAsync(s => s.CandidateId == candidate.Id && s.JobId == request.JobId, cancellationToken);

        bool isSaved;

        if (existingSave != null)
        {
            // Đã lưu → Hủy lưu (xóa vật lý vì đây là bảng junction, không dùng soft delete)
            _context.SavedJobs.Remove(existingSave);
            isSaved = false;
        }
        else
        {
            // Chưa lưu → Thêm mới
            var savedJob = new SavedJob
            {
                CandidateId = candidate.Id,
                JobId = request.JobId,
                SavedAt = _dateTime.Now
            };
            _context.SavedJobs.Add(savedJob);
            isSaved = true;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new SaveToggleResultDto(request.JobId, isSaved);
    }
}
