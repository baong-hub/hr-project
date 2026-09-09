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
    IDateTimeProvider dateTime,
    INotificationSender notificationSender,
    IEmailService emailService)
    : IRequestHandler<ScheduleInterviewCommand, InterviewDto>
{
    public async Task<InterviewDto> Handle(ScheduleInterviewCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate application exists
        var app = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (app == null)
            throw new NotFoundException("INTERVIEW_NOT_FOUND", "Đơn ứng tuyển không tồn tại.");

        // 2. [BR-02] Application must be SHORTLISTED or INTERVIEW
        if (app.Status != ApplicationStatus.SHORTLISTED && app.Status != ApplicationStatus.INTERVIEW)
            throw new BadRequestException("INTERVIEW_INVALID_APPLICATION_STATUS", "Đơn ứng tuyển chưa được sơ tuyển hoặc phỏng vấn.");

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

        // 8. Trigger real-time notification and email to Candidate
        var candidateUserId = app.Candidate.UserId > 0 ? app.Candidate.UserId : (app.Candidate.User?.Id ?? 0);
        var candidateEmail = app.Candidate.User?.Email ?? string.Empty;

        if (candidateUserId > 0)
        {
            await notificationSender.SendNotificationAsync(
                candidateUserId,
                "Lời mời phỏng vấn mới",
                $"Bạn vừa nhận được lời mời phỏng vấn vị trí {app.Job.Title} từ {app.Job.Company.Name} vào lúc {interview.StartTime:dd/MM/yyyy HH:mm}.",
                NotificationType.INTERVIEW_INVITE,
                "/interviews",
                cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(candidateEmail))
        {
            _ = emailService.SendInterviewInvitationAsync(
                candidateEmail,
                app.Candidate.FullName,
                app.Job.Title,
                app.Job.Company.Name,
                interview.StartTime,
                interview.EndTime,
                interview.InterviewType.ToString(),
                interview.LocationOrLink,
                interview.Notes,
                cancellationToken);
        }

        // 9. Build response DTO
        return new InterviewDto(
            interview.Id,
            interview.ApplicationId,
            app.Job.Title,
            app.Candidate.FullName,
            candidateEmail,
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

/// <summary>
/// Handler: Cập nhật trạng thái lịch phỏng vấn linh hoạt
/// </summary>
public class UpdateInterviewStatusCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IRequestHandler<UpdateInterviewStatusCommand, bool>
{
    public async Task<bool> Handle(UpdateInterviewStatusCommand request, CancellationToken cancellationToken)
    {
        var interview = await context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);

        if (interview == null)
            throw new NotFoundException("INTERVIEW_NOT_FOUND", "Lịch phỏng vấn không tồn tại.");

        var userId = currentUserService.UserId;
        var statusUpper = request.Status?.Trim().ToUpper() ?? "";

        // Kiểm tra nếu ứng viên đang phản hồi
        if (interview.Application.CandidateId == userId)
        {
            if (statusUpper == "ACCEPTED" || statusUpper == "INTERVIEW_SCHEDULED")
            {
                interview.Status = InterviewStatus.INTERVIEW_SCHEDULED;
            }
            else if (statusUpper == "DECLINED")
            {
                interview.Status = InterviewStatus.DECLINED;
                if (!string.IsNullOrWhiteSpace(request.Reason))
                {
                    interview.Notes = (interview.Notes ?? string.Empty) + $"\n[Ứng viên từ chối] {request.Reason}";
                }
            }
            else
            {
                throw new BadRequestException("INVALID_STATUS", "Ứng viên chỉ có thể xác nhận (ACCEPTED) hoặc từ chối (DECLINED) lịch phỏng vấn.");
            }
        }
        else
        {
            // Nhà tuyển dụng hoặc Admin
            var employer = await context.Employers
                .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

            if (!currentUserService.IsSuperAdmin && (employer == null || interview.Application.Job.CompanyId != employer.CompanyId))
            {
                throw new ForbiddenException("INTERVIEW_FORBIDDEN", "Bạn không được phép thao tác trên lịch hẹn này.");
            }

            if (statusUpper == "CANCELLED")
            {
                interview.Status = InterviewStatus.CANCELLED;
            }
            else if (statusUpper == "COMPLETED" || statusUpper == "INTERVIEW_COMPLETED")
            {
                interview.Status = InterviewStatus.INTERVIEW_COMPLETED;
            }
            else if (statusUpper == "ACCEPTED" || statusUpper == "INTERVIEW_SCHEDULED")
            {
                interview.Status = InterviewStatus.INTERVIEW_SCHEDULED;
            }
            else if (Enum.TryParse<InterviewStatus>(statusUpper, true, out var parsedStatus))
            {
                interview.Status = parsedStatus;
            }
            else
            {
                throw new BadRequestException("INVALID_STATUS", "Trạng thái phỏng vấn không hợp lệ.");
            }

            if (!string.IsNullOrWhiteSpace(request.Reason))
            {
                interview.Notes = (interview.Notes ?? string.Empty) + $"\n[Ghi chú] {request.Reason}";
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

/// <summary>
/// Handler: Đánh giá buổi phỏng vấn (Chấm điểm 6 tiêu chí, tính overall score và cập nhật trạng thái)
/// </summary>
public class SubmitInterviewEvaluationCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    INotificationSender notificationSender,
    IEmailService emailService)
    : IRequestHandler<SubmitInterviewEvaluationCommand, InterviewEvaluationDto>
{
    public async Task<InterviewEvaluationDto> Handle(SubmitInterviewEvaluationCommand request, CancellationToken cancellationToken)
    {
        var interview = await context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .Include(i => i.Application)
                .ThenInclude(a => a.Candidate)
                    .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(i => i.Id == request.InterviewId, cancellationToken);

        if (interview == null)
            throw new NotFoundException("INTERVIEW_NOT_FOUND", "Buổi phỏng vấn không tồn tại.");

        var userId = currentUserService.UserId;
        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

        if (!currentUserService.IsSuperAdmin && (employer == null || interview.Application.Job.CompanyId != employer.CompanyId))
        {
            throw new ForbiddenException("INTERVIEW_FORBIDDEN", "Bạn không có quyền đánh giá buổi phỏng vấn này.");
        }

        var eval = request.Evaluation;
        if (!Enum.TryParse<EvaluationResult>(eval.Result, true, out var resultEnum))
        {
            throw new BadRequestException("INVALID_RESULT", "Kết quả đánh giá không hợp lệ. Chọn PASS, FAIL hoặc NEXT_ROUND.");
        }

        // Validate scores (0..10)
        decimal ClampScore(decimal score) => Math.Max(0, Math.Min(10, score));
        var tech = ClampScore(eval.TechnicalScore);
        var comm = ClampScore(eval.CommunicationScore);
        var prob = ClampScore(eval.ProblemSolvingScore);
        var exp = ClampScore(eval.ExperienceScore);
        var cult = ClampScore(eval.CultureFitScore);
        var sal = ClampScore(eval.SalaryExpectationScore);

        var overall = Math.Round((tech + comm + prob + exp + cult + sal) / 6.0m, 1);

        var evaluation = new InterviewEvaluation
        {
            InterviewId = interview.Id,
            TechnicalScore = tech,
            CommunicationScore = comm,
            ProblemSolvingScore = prob,
            ExperienceScore = exp,
            CultureFitScore = cult,
            SalaryExpectationScore = sal,
            OverallScore = overall,
            Result = resultEnum,
            Comments = eval.Comments,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now,
            CreatedBy = userId
        };

        context.InterviewEvaluations.Add(evaluation);

        // Update interview status to COMPLETED if not already
        interview.Status = InterviewStatus.INTERVIEW_COMPLETED;
        interview.UpdatedAt = DateTime.Now;

        var candidateUserId = interview.Application.Candidate.UserId > 0 
            ? interview.Application.Candidate.UserId 
            : (interview.Application.Candidate.User?.Id ?? 0);
        var candidateEmail = interview.Application.Candidate.User?.Email ?? string.Empty;
        var jobTitle = interview.Application.Job.Title;
        var companyName = interview.Application.Job.Company.Name;
        var candidateName = interview.Application.Candidate.FullName;

        // Auto-update application status based on evaluation result
        if (resultEnum == EvaluationResult.PASS)
        {
            interview.Application.Status = ApplicationStatus.OFFER;
            interview.Application.UpdatedAt = DateTime.Now;

            if (candidateUserId > 0)
            {
                await notificationSender.SendNotificationAsync(
                    candidateUserId,
                    "Chúc mừng! Bạn đã vượt qua phỏng vấn",
                    $"Chúc mừng bạn đã đạt kết quả xuất sắc trong buổi phỏng vấn vị trí {jobTitle} tại {companyName}. Nhà tuyển dụng sẽ sớm gửi thông tin đề xuất nhận việc!",
                    NotificationType.APPLICATION_STATUS,
                    "/candidate/applications",
                    cancellationToken);
            }

            if (!string.IsNullOrWhiteSpace(candidateEmail))
            {
                _ = emailService.SendApplicationStatusEmailAsync(
                    candidateEmail,
                    candidateName,
                    jobTitle,
                    companyName,
                    "OFFER",
                    "Chúc mừng bạn đã vượt qua vòng phỏng vấn xuất sắc!",
                    cancellationToken);
            }
        }
        else if (resultEnum == EvaluationResult.FAIL)
        {
            interview.Application.Status = ApplicationStatus.REJECTED;
            interview.Application.UpdatedAt = DateTime.Now;

            if (candidateUserId > 0)
            {
                await notificationSender.SendNotificationAsync(
                    candidateUserId,
                    "Thông báo kết quả phỏng vấn",
                    $"Cảm ơn bạn đã tham gia phỏng vấn vị trí {jobTitle} tại {companyName}. Rất tiếc hiện tại hồ sơ chưa phù hợp.",
                    NotificationType.APPLICATION_STATUS,
                    "/candidate/applications",
                    cancellationToken);
            }

            if (!string.IsNullOrWhiteSpace(candidateEmail))
            {
                _ = emailService.SendApplicationStatusEmailAsync(
                    candidateEmail,
                    candidateName,
                    jobTitle,
                    companyName,
                    "REJECTED",
                    "Cảm ơn bạn đã dành thời gian tham gia phỏng vấn.",
                    cancellationToken);
            }
        }
        else if (resultEnum == EvaluationResult.NEXT_ROUND)
        {
            if (candidateUserId > 0)
            {
                await notificationSender.SendNotificationAsync(
                    candidateUserId,
                    "Kết quả phỏng vấn - Vòng tiếp theo",
                    $"Buổi phỏng vấn vị trí {jobTitle} tại {companyName} đã hoàn thành tốt đẹp. Bạn được chọn để tham gia vòng phỏng vấn tiếp theo!",
                    NotificationType.APPLICATION_STATUS,
                    "/interviews",
                    cancellationToken);
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        return new InterviewEvaluationDto(
            evaluation.Id,
            evaluation.InterviewId,
            evaluation.TechnicalScore,
            evaluation.CommunicationScore,
            evaluation.ProblemSolvingScore,
            evaluation.ExperienceScore,
            evaluation.CultureFitScore,
            evaluation.SalaryExpectationScore,
            evaluation.OverallScore,
            evaluation.Result.ToString(),
            evaluation.Comments,
            evaluation.CreatedAt
        );
    }
}
