using HR.Application.Common.Models;
using HR.Application.Common.Exceptions;
using HR.Application.Interviews;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR.Infrastructure.Security;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/interviews")]
[Authorize]
public class InterviewsController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// EP-01: POST /api/v1/interviews — Lên lịch phỏng vấn mới
    /// </summary>
    [HttpPost]
    [RequirePermission("interview:schedule")]
    public async Task<IActionResult> Schedule([FromBody] ScheduleInterviewDto dto)
    {
        var startTime = dto.StartTime != default ? dto.StartTime : (dto.ScheduledAt ?? DateTime.Now.AddDays(1));
        var endTime = dto.EndTime ?? startTime.AddHours(1);
        var interviewType = !string.IsNullOrWhiteSpace(dto.InterviewType) ? dto.InterviewType : "ONLINE";
        var locationOrLink = !string.IsNullOrWhiteSpace(dto.LocationOrLink) 
            ? dto.LocationOrLink 
            : (!string.IsNullOrWhiteSpace(dto.MeetingLink) ? dto.MeetingLink : (dto.Location ?? "Online"));

        var command = new ScheduleInterviewCommand(
            dto.ApplicationId,
            startTime,
            endTime,
            interviewType,
            locationOrLink,
            dto.Notes
        );

        var result = await mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<InterviewDto>.Ok(result));
    }

    /// <summary>
    /// EP-02: GET /api/v1/interviews/{id} — Chi tiết một lịch phỏng vấn
    /// </summary>
    [HttpGet("{id:int}")]
    [RequirePermission("interview:view")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await mediator.Send(new GetInterviewByIdQuery(id));
        if (result == null)
            throw new NotFoundException("INTERVIEW_NOT_FOUND", "Lịch phỏng vấn không tồn tại.");

        return Ok(ApiResponse<InterviewDto>.Ok(result));
    }

    /// <summary>
    /// EP-03: GET /api/v1/interviews — Danh sách lịch phỏng vấn (phân trang)
    /// </summary>
    [HttpGet]
    [RequirePermission("interview:view")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sort = null,
        [FromQuery] string? search = null,
        [FromQuery(Name = "filter[status]")] string? status = null)
    {
        var result = await mediator.Send(new GetInterviewsQuery(page, pageSize, sort, search, status));
        return Ok(ApiResponse<PagedResult<InterviewDto>>.Ok(result));
    }

    /// <summary>
    /// EP-04: PATCH /api/v1/interviews/{id}/respond — Ứng viên phản hồi lời mời
    /// </summary>
    [HttpPatch("{id:int}/respond")]
    [RequirePermission("interview:respond")]
    public async Task<IActionResult> Respond(int id, [FromBody] RespondInterviewDto dto)
    {
        var result = await mediator.Send(new RespondInterviewCommand(id, dto.Accept, dto.Reason));
        return Ok(ApiResponse<bool>.Ok(result));
    }

    /// <summary>
    /// EP-05: PATCH /api/v1/interviews/{id}/cancel — Hủy lịch phỏng vấn
    /// </summary>
    [HttpPatch("{id:int}/cancel")]
    [RequirePermission("interview:schedule")]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await mediator.Send(new CancelInterviewCommand(id));
        return Ok(ApiResponse<bool>.Ok(result));
    }

    /// <summary>
    /// PATCH /api/v1/interviews/{id}/status — Cập nhật trạng thái lịch phỏng vấn linh hoạt
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [HttpPut("{id:int}/status")]
    [RequirePermission("interview:schedule", "interview:respond", "interview:view")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateInterviewStatusDto dto)
    {
        var result = await mediator.Send(new UpdateInterviewStatusCommand(id, dto.Status, dto.Reason));
        return Ok(ApiResponse<bool>.Ok(result));
    }

    /// <summary>
    /// POST /api/v1/interviews/{id}/evaluations — Gửi đánh giá buổi phỏng vấn
    /// </summary>
    [HttpPost("{id:int}/evaluations")]
    [RequirePermission("interview:schedule", "job:manage")]
    public async Task<IActionResult> SubmitEvaluation(int id, [FromBody] CreateInterviewEvaluationDto dto)
    {
        var result = await mediator.Send(new SubmitInterviewEvaluationCommand(id, dto));
        return Ok(ApiResponse<InterviewEvaluationDto>.Ok(result));
    }

    /// <summary>
    /// GET /api/v1/interviews/{id}/evaluations — Lấy danh sách đánh giá của buổi phỏng vấn
    /// </summary>
    [HttpGet("{id:int}/evaluations")]
    [RequirePermission("interview:view", "job:manage")]
    public async Task<IActionResult> GetEvaluations(int id)
    {
        var result = await mediator.Send(new GetInterviewEvaluationsQuery(id));
        return Ok(ApiResponse<List<InterviewEvaluationDto>>.Ok(result));
    }
}
