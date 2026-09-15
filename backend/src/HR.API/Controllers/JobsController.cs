using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.Jobs;
using HR.Application.Jobs.Dtos;
using HR.Application.Jobs.Commands.CreateJob;
using HR.Application.Jobs.Commands.ChangeJobStatus;
using HR.Application.Jobs.Queries.GetJobs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HR.Infrastructure.Security;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/jobs")]
[Authorize]
public class JobsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] GetJobsQuery query)
    {
        var result = await mediator.Send(query);
        return Ok(ApiResponse<PagedResult<JobDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await mediator.Send(new GetJobByIdQuery(id));
        if (result == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Không tìm thấy tin tuyển dụng.");
        }
        return Ok(ApiResponse<JobDto>.Ok(result));
    }

    [HttpPost]
    [RequirePermission("job:post")]
    public async Task<IActionResult> Create([FromBody] CreateJobCommand command)
    {
        var result = await mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<JobDto>.Ok(result));
    }

    [HttpPut("{id:int}")]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateJobCommand command)
    {
        if (id != command.Id)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "id", new[] { "ID không khớp." } }
            });
        }
        var result = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(result));
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await mediator.Send(new DeleteJobCommand(id));
        return Ok(ApiResponse<bool>.Ok(result));
    }

    [HttpPatch("{id:int}/status")]
    [RequirePermission("job:moderate", "job:manage")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] ChangeJobStatusCommand command)
    {
        if (id != command.Id)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "id", new[] { "ID không khớp." } }
            });
        }
        var result = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(result));
    }

    [HttpPost("{id:int}/view")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackView(
        int id, 
        [FromServices] IApplicationDbContext context, 
        [FromServices] ICurrentUserService currentUserService,
        CancellationToken cancellationToken)
    {
        var job = await context.Jobs.Include(j => j.Employer).FirstOrDefaultAsync(j => j.Id == id && j.DeletedAt == null, cancellationToken);
        if (job != null)
        {
            var userId = currentUserService.UserId > 0 ? currentUserService.UserId : (int?)null;
            if (userId == null || job.Employer?.UserId != userId)
            {
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var cutoff = System.DateTime.Now.AddSeconds(-10);

                var isRecentView = await context.JobViewLogs.AnyAsync(v =>
                    v.JobId == job.Id &&
                    ((userId != null && v.UserId == userId) || (userId == null && v.IpAddress == ip)) &&
                    v.ViewedAt >= cutoff,
                    cancellationToken);

                if (!isRecentView)
                {
                    context.JobViewLogs.Add(new Domain.Entities.JobViewLog
                    {
                        JobId = job.Id,
                        UserId = userId,
                        IpAddress = ip,
                        UserAgent = Request.Headers.UserAgent.ToString(),
                        ViewedAt = System.DateTime.Now
                    });
                    await context.SaveChangesAsync(cancellationToken);
                }
            }
        }
        return Ok(ApiResponse<bool>.Ok(true));
    }
}
