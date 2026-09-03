using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HR.Infrastructure.Services;

public class UserPresenceService(IServiceScopeFactory scopeFactory) : IUserPresenceService
{
    private readonly ConcurrentDictionary<int, HashSet<string>> _activeConnections = new();
    private readonly ConcurrentDictionary<string, int> _connectionUsers = new();

    public async Task ConnectTabAsync(int userId, string connectionId)
    {
        var isFirstTab = false;
        var currentTabCount = 0;

        _connectionUsers[connectionId] = userId;

        _activeConnections.AddOrUpdate(
            userId,
            _ => {
                isFirstTab = true;
                currentTabCount = 1;
                return new HashSet<string> { connectionId };
            },
            (_, set) => {
                lock (set)
                {
                    set.Add(connectionId);
                    currentTabCount = set.Count;
                }
                return set;
            });

        if (isFirstTab)
        {
            using var scope = scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            var now = DateTime.Now;
            var presenceLog = new UserPresenceLog
            {
                UserId = userId,
                LoginTime = now,
                LogoutTime = null,
                TabCount = 1,
                CreatedAt = now,
                UpdatedAt = now
            };

            context.UserPresenceLogs.Add(presenceLog);
            await context.SaveChangesAsync(default);
        }
        else
        {
            using var scope = scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            var activeLog = await context.UserPresenceLogs
                .Where(x => x.UserId == userId && x.LogoutTime == null)
                .OrderByDescending(x => x.LoginTime)
                .FirstOrDefaultAsync();

            if (activeLog != null && currentTabCount > activeLog.TabCount)
            {
                activeLog.TabCount = currentTabCount;
                activeLog.UpdatedAt = DateTime.Now;
                await context.SaveChangesAsync(default);
            }
        }
    }

    public async Task DisconnectTabAsync(string connectionId)
    {
        if (!_connectionUsers.TryRemove(connectionId, out var userId))
        {
            return;
        }

        var isLastTab = false;

        if (_activeConnections.TryGetValue(userId, out var set))
        {
            lock (set)
            {
                set.Remove(connectionId);
                if (set.Count == 0)
                {
                    isLastTab = true;
                    _activeConnections.TryRemove(userId, out _);
                }
            }
        }

        if (isLastTab)
        {
            using var scope = scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            var activeLog = await context.UserPresenceLogs
                .Where(x => x.UserId == userId && x.LogoutTime == null)
                .OrderByDescending(x => x.LoginTime)
                .FirstOrDefaultAsync();

            if (activeLog != null)
            {
                activeLog.LogoutTime = DateTime.Now;
                activeLog.UpdatedAt = DateTime.Now;
                await context.SaveChangesAsync(default);
            }
        }
    }

    public int GetActiveTabCount(int userId)
    {
        if (_activeConnections.TryGetValue(userId, out var set))
        {
            lock (set)
            {
                return set.Count;
            }
        }
        return 0;
    }

    public Dictionary<int, int> GetAllOnlineUsersWithTabCount()
    {
        var result = new Dictionary<int, int>();
        foreach (var kvp in _activeConnections)
        {
            lock (kvp.Value)
            {
                if (kvp.Value.Count > 0)
                {
                    result[kvp.Key] = kvp.Value.Count;
                }
            }
        }
        return result;
    }
}

