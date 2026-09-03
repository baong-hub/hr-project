using Microsoft.AspNetCore.Mvc;
using MediatR;
using HR.Application.LogActivities.Queries.GetLogActivities;
using HR.Application.LogActivities.Queries.GetLogActivitiesReport;
using HR.Application.LogActivities.Queries.GetLogActivitiesStats;
using HR.Application.LogActivities.Queries.GetUserPresenceTimeline;
using Microsoft.AspNetCore.Authorization;
using HR.Infrastructure.Security;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/log-activities")]
[Authorize]
public class LogActivitiesController : ControllerBase
{
    private readonly IMediator _mediator;

    public LogActivitiesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] string moduleName, [FromQuery] int entityId)
    {
        var result = await _mediator.Send(new GetLogActivitiesQuery(moduleName, entityId));
        return Ok(result);
    }

    [HttpGet("report")]
    [RequirePermission("logactivity:view")]
    public async Task<IActionResult> GetLogReport([FromQuery] GetLogActivitiesReportQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("stats")]
    [RequirePermission("logactivity:view")]
    public async Task<IActionResult> GetLogStats([FromQuery] GetLogActivitiesStatsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("presence")]
    [RequirePermission("logactivity:view")]
    public async Task<IActionResult> GetPresenceTimeline([FromQuery] GetUserPresenceTimelineQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}

