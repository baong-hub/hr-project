using HR.Application.Common.Models;
using MediatR;

namespace HR.Application.Interviews;

/// <summary>
/// EP-03: GET /api/v1/interviews — Danh sách lịch phỏng vấn (phân trang)
/// </summary>
public record GetInterviewsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Sort = null,
    string? Search = null,
    string? Status = null
) : IRequest<PagedResult<InterviewDto>>;

/// <summary>
/// EP-02: GET /api/v1/interviews/{id} — Chi tiết lịch phỏng vấn
/// </summary>
public record GetInterviewByIdQuery(int Id) : IRequest<InterviewDto?>;
