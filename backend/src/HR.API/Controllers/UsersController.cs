using HR.Application.Common.Models;
using HR.Application.Users;
using HR.Application.UserRoles;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using HR.Infrastructure.Security;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission("user:view")]
    public async Task<IActionResult> GetAll([FromQuery] GetUsersQuery query)
        => Ok(ApiResponse<PagedResult<UserListItemDto>>.Ok(await mediator.Send(query)));

    [HttpGet("{id:int}")]
    [RequirePermission("user:view")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await mediator.Send(new GetUserByIdQuery(id));
        return result is null ? NotFound(ApiResponse<object>.Fail("USER_NOT_FOUND", "Không tìm thấy người dùng.")) : Ok(ApiResponse<UserDetailDto>.Ok(result));
    }

    [HttpPost]
    [RequirePermission("user:create")]
    public async Task<IActionResult> Create([FromBody] CreateUserCommand command)
    {
        var id = await mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<int>.Ok(id));
    }

    [HttpPut("{id:int}")]
    [RequirePermission("user:update")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserCommand command)
    {
        if (id != command.Id) return BadRequest(ApiResponse<object>.Fail("INVALID_ID", "ID không khớp."));
        await mediator.Send(command);
        return Ok(ApiResponse<object>.Ok(new { message = "Cập nhật thành công." }));
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("user:delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await mediator.Send(new DeleteUserCommand(id));
        return Ok(ApiResponse<object>.Ok(new { message = "Xóa tài khoản thành công." }));
    }

    [HttpPut("{id:int}/reset-password")]
    [RequirePermission("user:update")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordCommand command)
    {
        if (id != command.Id) return BadRequest(ApiResponse<object>.Fail("INVALID_ID", "ID không khớp."));
        await mediator.Send(command);
        return Ok(ApiResponse<object>.Ok(new { message = "Khôi phục mật khẩu thành công." }));
    }

    [HttpGet("{id:int}/password")]
    [RequirePermission("user:view")]
    public async Task<IActionResult> GetPassword(int id)
    {
        var password = await mediator.Send(new GetUserPasswordQuery(id));
        return Ok(ApiResponse<string>.Ok(password));
    }

    [HttpPost("{id:int}/avatar")]
    [RequirePermission("user:update")]
    public async Task<IActionResult> UploadAvatar(int id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("INVALID_FILE", "File không hợp lệ."));

        using var stream = file.OpenReadStream();
        var url = await mediator.Send(new UploadUserAvatarCommand(id, stream, file.FileName));
        return Ok(ApiResponse<string>.Ok(url));
    }

    // --- User Role Assignment ---

    [HttpGet("{id:int}/roles")]
    [RequirePermission("user-role:view", "user:view", "user:create", "user:update", "user-role:assign")]
    public async Task<IActionResult> GetUserRoles(int id)
        => Ok(ApiResponse<List<int>>.Ok(await mediator.Send(new GetUserRolesQuery(id))));

    [HttpPut("{id:int}/roles")]
    [RequirePermission("user-role:assign")]
    public async Task<IActionResult> AssignRoles(int id, [FromBody] List<int> roleIds)
    {
        await mediator.Send(new AssignUserRolesCommand(id, roleIds));
        return Ok(ApiResponse<object>.Ok(new { message = "Gán vai trò thành công." }));
    }

    [HttpGet("{id:int}/permissions-summary")]
    [RequirePermission("user-role:view")]
    public async Task<IActionResult> GetPermissionsSummary(int id)
        => Ok(ApiResponse<List<UserPermissionSummaryDto>>.Ok(await mediator.Send(new GetUserPermissionSummaryQuery(id))));

    [HttpGet("{id:int}/direct-permissions")]
    [RequirePermission("user-role:view")]
    public async Task<IActionResult> GetDirectPermissions(int id)
        => Ok(ApiResponse<List<UserDirectPermissionDto>>.Ok(await mediator.Send(new GetUserDirectPermissionsQuery(id))));

    [HttpPut("{id:int}/direct-permissions")]
    [RequirePermission("user-role:assign")]
    public async Task<IActionResult> AssignDirectPermissions(int id, [FromBody] List<PermissionAssignmentDto> permissions)
    {
        await mediator.Send(new AssignUserDirectPermissionsCommand(id, permissions));
        return Ok(ApiResponse<object>.Ok(new { message = "Gán quyền trực tiếp thành công." }));
    }
}


