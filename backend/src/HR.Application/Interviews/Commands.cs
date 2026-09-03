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
