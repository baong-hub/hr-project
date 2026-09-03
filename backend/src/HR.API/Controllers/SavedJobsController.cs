using System.Collections.Generic;
using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.SavedJobs.Dtos;
using HR.Application.SavedJobs.Commands.ToggleSaveJob;
using HR.Application.SavedJobs.Queries.GetSavedJobs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR.Infrastructure.Security;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/jobs")]
[Authorize]
public class SavedJobsController(IMediator mediator) : ControllerBase
{
    private readonly IMediator _mediator = mediator;

    /// <summary>
    /// EP-01: Lưu / Hủy lưu tin tuyển dụng (Toggle)
    /// </summary>
    [HttpPost("{id:int}/save")]
    [RequirePermission("job:save")]
    public async Task<IActionResult> ToggleSave(int id)
    {
        var result = await _mediator.Send(new ToggleSaveJobCommand(id));
        return Ok(ApiResponse<SaveToggleResultDto>.Ok(result));
    }

    /// <summary>
    /// EP-02: Lấy danh sách tin tuyển dụng đã lưu
    /// </summary>
    [HttpGet("saved")]
    [RequirePermission("job:save")]
    public async Task<IActionResult> GetSavedJobs([FromQuery] GetSavedJobsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(ApiResponse<PagedResult<SavedJobDto>>.Ok(result));
    }
}
