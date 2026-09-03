using HR.Application.Sites.Queries.GetSites;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/sites")]
public class SitesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSites()
        => Ok(await mediator.Send(new GetSitesQuery()));
}

