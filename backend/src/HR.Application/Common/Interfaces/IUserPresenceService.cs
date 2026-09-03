using System.Collections.Generic;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public interface IUserPresenceService
{
    Task ConnectTabAsync(int userId, string connectionId);
    Task DisconnectTabAsync(string connectionId);
    int GetActiveTabCount(int userId);
    Dictionary<int, int> GetAllOnlineUsersWithTabCount();
}

