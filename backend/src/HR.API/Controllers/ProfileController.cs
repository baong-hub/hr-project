using HR.Application.Common.Models;
using HR.Application.Profile;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ProfileController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var result = await mediator.Send(new GetMyProfileQuery());
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        var command = new ChangePasswordCommand(
            request.OldPassword,
            request.NewPassword,
            request.ConfirmPassword
        );
        await mediator.Send(command);
        return Ok(ApiResponse<object>.Ok(new { message = "Đổi mật khẩu thành công." }));
    }
}

