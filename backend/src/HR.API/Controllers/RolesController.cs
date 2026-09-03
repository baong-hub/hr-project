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
public class RolesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission("user-role:view", "user:view", "user:create", "user:update", "user-role:assign")]
    public async Task<IActionResult> GetAll([FromQuery] GetRolesQuery query)
        => Ok(ApiResponse<PagedResult<RoleListItemDto>>.Ok(await mediator.Send(query)));

    [HttpGet("levels")]
    [RequirePermission("user-role:view", "user:view", "user:create", "user:update", "user-role:assign")]
    public async Task<IActionResult> GetLevels()
        => Ok(ApiResponse<List<RoleLevelDto>>.Ok(await mediator.Send(new GetRoleLevelsQuery())));

    [HttpGet("{id:int}")]
    [RequirePermission("user-role:view", "user:view", "user:create", "user:update", "user-role:assign")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await mediator.Send(new GetRoleByIdQuery(id));
        return result is null 
            ? NotFound(ApiResponse<object>.Fail("ROLE_NOT_FOUND", "Không tìm thấy vai trò.")) 
            : Ok(ApiResponse<RoleDetailDto>.Ok(result));
    }

    [HttpPost]
    [RequirePermission("user-role:manage")]
    public async Task<IActionResult> Create([FromBody] CreateRoleCommand command)
    {
        var id = await mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<int>.Ok(id));
    }

    [HttpPut("{id:int}")]
    [RequirePermission("user-role:manage")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleCommand command)
    {
        if (id != command.Id) return BadRequest(ApiResponse<object>.Fail("INVALID_ID", "ID không khớp."));
        await mediator.Send(command);
        return Ok(ApiResponse<object>.Ok(new { message = "Cập nhật thành công." }));
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("user-role:manage")]
    public async Task<IActionResult> Delete(int id)
    {
        await mediator.Send(new DeleteRoleCommand(id));
        return Ok(ApiResponse<object>.Ok(new { message = "Xóa vai trò thành công." }));
    }

    [HttpPut("{id:int}/permissions")]
    [RequirePermission("user-role:manage")]
    public async Task<IActionResult> AssignPermissions(int id, [FromBody] AssignRolePermissionsCommand command)
    {
        if (id != command.RoleId) return BadRequest(ApiResponse<object>.Fail("INVALID_ID", "ID không khớp."));
        await mediator.Send(command);
        return Ok(ApiResponse<object>.Ok(new { message = "Gán quyền thành công." }));
    }

    [HttpPost("{id:int}/clone")]
    [RequirePermission("user-role:manage")]
    public async Task<IActionResult> Clone(int id, [FromBody] string newName)
    {
        var newId = await mediator.Send(new CloneRoleCommand(id, newName));
        return Ok(ApiResponse<int>.Ok(newId));
    }

    [HttpGet("{id:int}/logs")]
    [RequirePermission("user-role:view")]
    public async Task<IActionResult> GetLogs(int id)
        => Ok(ApiResponse<List<RoleChangeLogDto>>.Ok(await mediator.Send(new GetRoleChangeLogsQuery(id))));

    [HttpPut("{id:int}/users")]
    [RequirePermission("user-role:assign")]
    public async Task<IActionResult> AssignUsers(int id, [FromBody] List<int> userIds)
    {
        await mediator.Send(new AssignUsersToRoleCommand(id, userIds));
        return Ok(ApiResponse<object>.Ok(new { message = "Gán nhân viên thành công." }));
    }
}

