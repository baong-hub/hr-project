using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.Dashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController(IMediator mediator) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await mediator.Send(new GetDashboardStatsQuery());
        return Ok(ApiResponse<DashboardStatsDto>.Ok(result));
    }
}
