using System;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HR.API.Hubs;

[Authorize]
public class UserPresenceHub(IUserPresenceService presenceService) : Hub
{
    public async Task RegisterPresence(int userId)
    {
        await presenceService.ConnectTabAsync(userId, Context.ConnectionId);
    }

    public override async Task OnConnectedAsync()
    {
        var userIdClaim = Context.User?.FindFirst("userId")?.Value 
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
        {
            await presenceService.ConnectTabAsync(userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await presenceService.DisconnectTabAsync(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
