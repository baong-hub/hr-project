using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.Notifications.Dtos;
using HR.Application.Notifications.Queries.GetNotifications;
using HR.Application.Notifications.Queries.GetUnreadCount;
using HR.Application.Notifications.Commands.MarkAsRead;
using HR.Application.Notifications.Commands.MarkAllAsRead;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR.Infrastructure.Security;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController(IMediator mediator) : ControllerBase
{
    private readonly IMediator _mediator = mediator;

    [HttpGet]
    [RequirePermission("notification:view")]
    public async Task<IActionResult> GetNotifications([FromQuery] GetNotificationsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(ApiResponse<PagedResult<NotificationDto>>.Ok(result));
    }

    [HttpGet("unread-count")]
    [RequirePermission("notification:view")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var result = await _mediator.Send(new GetUnreadCountQuery());
        return Ok(ApiResponse<UnreadCountDto>.Ok(result));
    }

    [HttpPatch("{id:int}/read")]
    [RequirePermission("notification:view")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var result = await _mediator.Send(new MarkAsReadCommand(id));
        return Ok(ApiResponse<bool>.Ok(result));
    }

    [HttpPost("read-all")]
    [RequirePermission("notification:view")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var result = await _mediator.Send(new MarkAllAsReadCommand());
        return Ok(ApiResponse<bool>.Ok(result));
    }
}
