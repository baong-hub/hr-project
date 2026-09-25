using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.SalaryInsights.Dtos;
using HR.Application.SalaryInsights.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/salary-insights")]
public class SalaryInsightsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SalaryInsightsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SalaryInsightsResultDto>>> GetSalaryInsights(
        [FromQuery] string? category,
        [FromQuery] string? location)
    {
        var result = await _mediator.Send(new GetSalaryInsightsQuery(category, location));
        return Ok(ApiResponse<SalaryInsightsResultDto>.Ok(result));
    }
}
