using HR.Application.Common.Models;
using HR.Application.UserRoles;
using HR.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class PermissionsController(IMediator mediator) : ControllerBase
{
    [HttpGet("tree")]
    [RequirePermission("user-role:view_tree")]
    public async Task<IActionResult> GetTree()
        => Ok(ApiResponse<List<PermissionTreeNodeDto>>.Ok(await mediator.Send(new GetPermissionTreeQuery())));
}

