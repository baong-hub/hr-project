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
        var command = new ScheduleInterviewCommand(
            dto.ApplicationId,
            dto.StartTime,
            dto.EndTime,
            dto.InterviewType,
            dto.LocationOrLink,
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
}
