using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Interviews;

/// <summary>
/// EP-01 Handler: Lên lịch phỏng vấn mới
/// Business rules: [BR-01] startTime > now, [BR-02] application must be SHORTLISTED
/// </summary>
public class ScheduleInterviewCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IDateTimeProvider dateTime)
    : IRequestHandler<ScheduleInterviewCommand, InterviewDto>
{
    public async Task<InterviewDto> Handle(ScheduleInterviewCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate application exists
        var app = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (app == null)
            throw new NotFoundException("INTERVIEW_NOT_FOUND", "Đơn ứng tuyển không tồn tại.");

        // 2. [BR-02] Application must be SHORTLISTED
        if (app.Status != ApplicationStatus.SHORTLISTED)
            throw new BadRequestException("INTERVIEW_INVALID_APPLICATION_STATUS", "Đơn ứng tuyển chưa được sơ tuyển.");

        // 3. Verify employer belongs to the same company
        var userId = currentUserService.UserId;
        var employer = await context.Employers
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

        if (employer == null || app.Job.CompanyId != employer.CompanyId)
            throw new ForbiddenException("INTERVIEW_FORBIDDEN", "Bạn không được phép thao tác trên lịch hẹn này.");

        // 4. Parse interview type enum
        if (!Enum.TryParse<InterviewType>(request.InterviewType, true, out var interviewType))
            throw new BadRequestException("VALIDATION_FAILED", "Hình thức phỏng vấn không hợp lệ.");

        // 5. Determine round number (auto-increment per application)
        var existingRounds = await context.Interviews
            .CountAsync(i => i.ApplicationId == request.ApplicationId, cancellationToken);
        var roundNumber = existingRounds + 1;

        // 6. Create interview entity
        var interview = new Interview
        {
            ApplicationId = request.ApplicationId,
            RoundNumber = roundNumber,
            RoundName = $"Vòng {roundNumber}",
            InterviewerId = employer.Id,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            InterviewType = interviewType,
            LocationOrLink = request.LocationOrLink,
            Notes = request.Notes,
            Status = InterviewStatus.INTERVIEW_INVITATION,
            CreatedAt = dateTime.Now,
            UpdatedAt = dateTime.Now
        };

        context.Interviews.Add(interview);

        // 7. Auto-transition application status to INTERVIEW
        app.Status = ApplicationStatus.INTERVIEW;

        await context.SaveChangesAsync(cancellationToken);

        // 8. Build response DTO
        var candidateUser = app.Candidate.User
            ?? await context.Users.FirstOrDefaultAsync(u => u.Id == app.CandidateId, cancellationToken);

        return new InterviewDto(
            interview.Id,
            interview.ApplicationId,
            app.Job.Title,
            app.Candidate.FullName,
            candidateUser?.Email ?? string.Empty,
            app.Job.Company.Name,
            interview.StartTime,
            interview.EndTime,
            interview.InterviewType.ToString(),
            interview.LocationOrLink ?? string.Empty,
            interview.Notes,
            interview.Status.ToString()
        );
    }
}

/// <summary>
/// EP-04 Handler: Ứng viên phản hồi lời mời phỏng vấn
/// Accept → INTERVIEW_SCHEDULED, Decline → DECLINED
/// </summary>
public class RespondInterviewCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IRequestHandler<RespondInterviewCommand, bool>
{
    public async Task<bool> Handle(RespondInterviewCommand request, CancellationToken cancellationToken)
    {
        var interview = await context.Interviews
            .Include(i => i.Application)
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);

        if (interview == null)
            throw new NotFoundException("INTERVIEW_NOT_FOUND", "Lịch phỏng vấn không tồn tại.");

        // Only the invited candidate can respond
        var userId = currentUserService.UserId;
        if (interview.Application.CandidateId != userId)
            throw new ForbiddenException("INTERVIEW_FORBIDDEN", "Bạn không được phép thao tác trên lịch hẹn này.");

        // Can only respond to INTERVIEW_INVITATION status
        if (interview.Status != InterviewStatus.INTERVIEW_INVITATION)
            throw new BadRequestException("INTERVIEW_INVALID_APPLICATION_STATUS",
                "Chỉ có thể phản hồi lời mời đang ở trạng thái chờ xác nhận.");

        interview.Status = request.Accept
            ? InterviewStatus.INTERVIEW_SCHEDULED
            : InterviewStatus.DECLINED;

        if (!request.Accept && !string.IsNullOrWhiteSpace(request.Reason))
        {
            interview.Notes = (interview.Notes ?? string.Empty) +
                $"\n[Ứng viên từ chối] {request.Reason}";
        }

        await context.SaveChangesAsync(cancellationToken);

        return true;
    }
}

/// <summary>
/// EP-05 Handler: Hủy lịch phỏng vấn (bởi Employer)
/// </summary>
public class CancelInterviewCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IRequestHandler<CancelInterviewCommand, bool>
{
    public async Task<bool> Handle(CancelInterviewCommand request, CancellationToken cancellationToken)
    {
        var interview = await context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);

        if (interview == null)
            throw new NotFoundException("INTERVIEW_NOT_FOUND", "Lịch phỏng vấn không tồn tại.");

        // Verify employer has permission on this interview
        var userId = currentUserService.UserId;
        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

        if (employer == null || interview.Application.Job.CompanyId != employer.CompanyId)
            throw new ForbiddenException("INTERVIEW_FORBIDDEN", "Bạn không được phép thao tác trên lịch hẹn này.");

        // Can only cancel if not already completed or cancelled
        if (interview.Status == InterviewStatus.INTERVIEW_COMPLETED ||
            interview.Status == InterviewStatus.EVALUATION ||
            interview.Status == InterviewStatus.CANCELLED)
        {
            throw new BadRequestException("INTERVIEW_INVALID_APPLICATION_STATUS",
                "Không thể hủy lịch phỏng vấn đã hoàn tất hoặc đã hủy.");
        }

        interview.Status = InterviewStatus.CANCELLED;
        await context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
