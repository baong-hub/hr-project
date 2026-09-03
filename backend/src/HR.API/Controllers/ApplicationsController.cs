using System.Collections.Generic;
using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.Common.Exceptions;
using HR.Application.Applications;
using HR.Application.Applications.Commands.SubmitApplication;
using HR.Application.Applications.Commands.ChangeApplicationStatus;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR.Infrastructure.Security;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/applications")]
[Authorize]
public class ApplicationsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission("job:apply", "job:manage")]
    public async Task<IActionResult> GetAll([FromQuery] GetApplicationsQuery query)
    {
        var result = await mediator.Send(query);
        return Ok(ApiResponse<List<ApplicationDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [RequirePermission("job:apply", "job:manage")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await mediator.Send(new GetApplicationByIdQuery(id));
        if (result == null)
        {
            throw new NotFoundException("APPLICATION_NOT_FOUND", "Đơn ứng tuyển không tồn tại.");
        }
        return Ok(ApiResponse<ApplicationDto>.Ok(result));
    }

    [HttpPost]
    [RequirePermission("job:apply")]
    public async Task<IActionResult> Create([FromBody] SubmitApplicationCommand command)
    {
        var result = await mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPatch("{id:int}/status")]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] ChangeApplicationStatusDto dto)
    {
        var result = await mediator.Send(new ChangeApplicationStatusCommand(id, dto.Status));
        return Ok(result);
    }
}
