using HR.Application.Common.Models;
using HR.Application.UserSettings.Commands.UpdateTheme;
using HR.Application.UserSettings.Commands.UpdateLanguage;
using HR.Application.UserSettings.Dtos;
using HR.Application.UserSettings.Queries.GetMyUserSettings;
using HR.Application.UserSettings.Queries.GetUserColumnSetting;
using HR.Application.UserSettings.Commands.UpdateUserColumnSetting;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/user-settings")]
[Authorize]
public class UserSettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public UserSettingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMySettings(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMyUserSettingsQuery(), ct);
        return Ok(result);
    }

    [HttpPut("me/theme")]
    public async Task<IActionResult> UpdateTheme([FromBody] UpdateThemeDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateThemeCommand(dto.ThemeMode), ct);
        return Ok(result);
    }

    [HttpPut("me/language")]
    public async Task<IActionResult> UpdateLanguage([FromBody] UpdateLanguageDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateLanguageCommand(dto.Language), ct);
        return Ok(result);
    }

    [HttpGet("columns/{gridKey}")]
    public async Task<IActionResult> GetColumnSetting(string gridKey, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetUserColumnSettingQuery(gridKey), ct);
        return Ok(result);
    }

    [HttpPut("columns/{gridKey}")]
    public async Task<IActionResult> UpdateColumnSetting(string gridKey, [FromBody] UpdateUserColumnSettingRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateUserColumnSettingCommand(gridKey, request.ColumnSettingsJson), ct);
        return Ok(result);
    }

    [HttpGet("system-configs")]
    public async Task<IActionResult> GetSystemConfigsGrouped(CancellationToken ct)
    {
        var result = await _mediator.Send(new HR.Application.UserSettings.Queries.GetSystemConfigsGrouped.GetSystemConfigsGroupedQuery(), ct);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("system-configs")]
    public async Task<IActionResult> UpdateSystemConfigs([FromBody] HR.Application.UserSettings.Commands.UpdateSystemConfigs.UpdateSystemConfigsCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }
}

public class UpdateUserColumnSettingRequest
{
    public string ColumnSettingsJson { get; set; } = null!;
}
