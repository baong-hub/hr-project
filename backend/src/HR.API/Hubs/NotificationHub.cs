using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HR.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task JoinUserGroup(int userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public async Task LeaveUserGroup(int userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public override async Task OnConnectedAsync()
    {
        var userIdClaim = Context.User?.FindFirst("userId")?.Value 
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userIdClaim = Context.User?.FindFirst("userId")?.Value 
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
