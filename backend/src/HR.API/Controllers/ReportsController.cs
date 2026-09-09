using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.Reports.Dtos;
using HR.Application.Reports.Queries.GetAdminSummary;
using HR.Application.Reports.Queries.GetEmployerSummary;
using HR.Application.Reports.Queries.GetRecruitmentFunnel;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using HR.Infrastructure.Security;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/reports")]
public class ReportsController(IMediator mediator) : ControllerBase
{
    [HttpGet("employer/summary")]
    [RequirePermission("report:view")]
    public async Task<IActionResult> GetEmployerSummary([FromQuery] string? from, [FromQuery] string? to)
    {
        var result = await mediator.Send(new GetEmployerSummaryQuery(from, to));
        return Ok(ApiResponse<EmployerSummaryDto>.Ok(result));
    }

    [HttpGet("employer/funnel")]
    [RequirePermission("report:view")]
    public async Task<IActionResult> GetEmployerFunnel([FromQuery] string? from, [FromQuery] string? to)
    {
        var result = await mediator.Send(new GetRecruitmentFunnelQuery(from, to));
        return Ok(ApiResponse<RecruitmentFunnelDto>.Ok(result));
    }

    [HttpGet("admin/summary")]
    [RequirePermission("report:view_all")]
    public async Task<IActionResult> GetAdminSummary()
    {
        var result = await mediator.Send(new GetAdminSummaryQuery());
        return Ok(ApiResponse<AdminSummaryDto>.Ok(result));
    }
}
