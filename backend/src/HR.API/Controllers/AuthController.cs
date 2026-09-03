using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR.Application.Common.Models;
using HR.Application.Auth.Dtos;
using HR.Application.Auth.Commands.RegisterCandidate;
using HR.Application.Auth.Commands.RegisterEmployer;
using HR.Application.Auth.Commands.Login;
using HR.Application.Auth.Commands.RefreshToken;
using HR.Application.Auth.Commands.Logout;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register/candidate")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterCandidate([FromBody] RegisterCandidateCommand command)
    {
        var result = await _mediator.Send(command);
        return StatusCode(201, ApiResponse<UserDto>.Ok(result));
    }

    [HttpPost("register/employer")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterEmployer([FromBody] RegisterEmployerCommand command)
    {
        var result = await _mediator.Send(command);
        return StatusCode(201, ApiResponse<UserDto>.Ok(result));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(ApiResponse<LoginResultDto>.Ok(result));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(ApiResponse<LoginResultDto>.Ok(result));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        await _mediator.Send(new LogoutCommand(request.RefreshToken));
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpGet("menus")]
    [Authorize]
    public async Task<IActionResult> GetAuthorizedMenus()
    {
        var result = await _mediator.Send(new HR.Application.Auth.Queries.GetAuthorizedMenus.GetAuthorizedMenusQuery());
        return Ok(ApiResponse<System.Collections.Generic.IEnumerable<HR.Application.Auth.Queries.GetAuthorizedMenus.MenuDto>>.Ok(result));
    }
}

public record LogoutRequest(string RefreshToken);
