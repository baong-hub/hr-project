using HR.Application.Common.Models;
using MediatR;

namespace HR.Application.Interviews;

/// <summary>
/// EP-01: POST /api/v1/interviews — Lên lịch phỏng vấn mới
/// </summary>
public record ScheduleInterviewCommand(
    int ApplicationId,
    DateTime StartTime,
    DateTime EndTime,
    string InterviewType,
    string LocationOrLink,
    string? Notes
) : IRequest<InterviewDto>;

/// <summary>
/// EP-04: PATCH /api/v1/interviews/{id}/respond — Ứng viên phản hồi lời mời
/// </summary>
public record RespondInterviewCommand(
    int Id,
    bool Accept,
    string? Reason
) : IRequest<bool>;

/// <summary>
/// EP-05: PATCH /api/v1/interviews/{id}/cancel — Hủy lịch phỏng vấn
/// </summary>
public record CancelInterviewCommand(int Id) : IRequest<bool>;

/// <summary>
/// PATCH /api/v1/interviews/{id}/status — Cập nhật trạng thái lịch phỏng vấn linh hoạt
/// </summary>
public record UpdateInterviewStatusCommand(int Id, string Status, string? Reason = null) : IRequest<bool>;

/// <summary>
/// POST /api/v1/interviews/{id}/evaluations — Gửi đánh giá buổi phỏng vấn
/// </summary>
public record SubmitInterviewEvaluationCommand(int InterviewId, CreateInterviewEvaluationDto Evaluation) : IRequest<InterviewEvaluationDto>;
