using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HR.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task JoinConversation(int conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Conversation_{conversationId}");
    }

    public async Task LeaveConversation(int conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Conversation_{conversationId}");
    }
}
