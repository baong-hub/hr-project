using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Models;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Applications.Commands.SubmitApplication;

public class SubmitApplicationHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<SubmitApplicationCommand, ApiResponse<ApplicationDto>>
{
    public async Task<ApiResponse<ApplicationDto>> Handle(SubmitApplicationCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        if (userId == 0)
        {
            throw new UnauthorizedAccessException("Người dùng chưa đăng nhập.");
        }

        var candidate = await context.Candidates
            .FirstOrDefaultAsync(c => c.Id == userId, cancellationToken);

        if (candidate == null)
        {
            // Tự động tạo candidate nếu tài khoản chưa có profile candidate
            candidate = new Candidate
            {
                UserId = userId,
                VisibilityStatus = CandidateVisibilityStatus.PUBLIC
            };
            context.Candidates.Add(candidate);
            await context.SaveChangesAsync(cancellationToken);
        }

        // Validate Job exists
        var job = await context.Jobs
            .FirstOrDefaultAsync(j => j.Id == request.JobId, cancellationToken);
        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Tin tuyển dụng không tồn tại.");
        }

        // [BR-02] Tin tuyển dụng phải ở trạng thái PUBLISHED và ExpiredAt >= Today (DateTime.Today)
        if (job.Status != JobStatus.PUBLISHED || job.ExpiredAt < DateTime.Today)
        {
            throw new BadRequestException("JOB_NOT_ACTIVE", "Tin tuyển dụng đã đóng hoặc đã hết hạn.");
        }

        // Validate CV exists and belongs to current candidate
        var cv = await context.CandidateCvs
            .FirstOrDefaultAsync(c => c.Id == request.CandidateCvId && c.CandidateId == candidate.Id, cancellationToken);
        if (cv == null)
        {
            throw new NotFoundException("CV_NOT_FOUND", "Không tìm thấy CV tương ứng của bạn.");
        }

        // [BR-01] Kiểm tra xem candidate đã nộp đơn vào tin tuyển dụng này chưa
        var alreadyApplied = await context.Applications.AnyAsync(
            a => a.JobId == request.JobId && a.CandidateId == candidate.Id, cancellationToken);
        if (alreadyApplied)
        {
            throw new ConflictException("APPLICATION_ALREADY_SUBMITTED", "Bạn đã nộp đơn ứng tuyển cho công việc này.");
        }

        var application = new HR.Domain.Entities.Application
        {
            JobId = request.JobId,
            CandidateId = candidate.Id,
            CandidateCvId = request.CandidateCvId,
            CoverLetter = request.CoverLetter,
            Status = ApplicationStatus.APPLIED,
            AppliedAt = DateTime.Now,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        context.Applications.Add(application);
        await context.SaveChangesAsync(cancellationToken);

        // Load relations to return complete DTO
        var createdApp = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .Include(a => a.CandidateCv)
            .FirstOrDefaultAsync(a => a.Id == application.Id, cancellationToken);

        // Tính toán match score bằng logic có sẵn của dự án
        var score = GetApplicationsQueryHandler.CalculateMatchScore(
            createdApp?.Job?.Title ?? job.Title,
            createdApp?.Job?.Requirements ?? job.Requirements,
            createdApp?.Candidate?.Skills ?? candidate.Skills,
            createdApp?.Candidate?.ExperienceSummary ?? candidate.ExperienceSummary);

        var dto = new ApplicationDto(
            createdApp?.Id ?? application.Id,
            createdApp?.JobId ?? application.JobId,
            createdApp?.Job?.Title ?? job.Title,
            createdApp?.Job?.Company?.Name ?? "Hệ thống HR",
            createdApp?.CandidateId ?? application.CandidateId,
            createdApp?.Candidate?.User?.FullName ?? createdApp?.Candidate?.FullName ?? candidate.FullName ?? "Ứng viên",
            createdApp?.Candidate?.User?.Email ?? string.Empty,
            createdApp?.CandidateCvId ?? application.CandidateCvId,
            createdApp?.CandidateCv?.CvTitle ?? cv.CvTitle,
            createdApp?.CandidateCv?.FileUrl ?? cv.FileUrl ?? string.Empty,
            createdApp?.CoverLetter ?? application.CoverLetter,
            (createdApp?.Status ?? application.Status).ToString(),
            createdApp?.AppliedAt ?? application.AppliedAt,
            score
        );

        return ApiResponse<ApplicationDto>.Ok(dto);
    }
}
