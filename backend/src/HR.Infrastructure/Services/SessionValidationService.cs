using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace HR.Infrastructure.Services;

public class SessionValidationService(IServiceScopeFactory scopeFactory, IMemoryCache cache) : ISessionValidationService
{
    private const string CachePrefix = "revoked_session_";

    public async Task<bool> IsSessionRevokedAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(sessionId)) return false;

        var cacheKey = CachePrefix + sessionId;

        if (cache.TryGetValue<bool>(cacheKey, out var isRevokedCached))
        {
            return isRevokedCached;
        }

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var session = await db.UserSessions
            .FirstOrDefaultAsync(x => x.SessionId == sessionId, cancellationToken);

        if (session == null)
        {
            return false;
        }

        var now = DateTime.Now;
        if (session.ExpiresAt <= now)
        {
            session.IsRevoked = true;
            session.RevokedAt = now;
            session.UpdatedAt = now;
            await db.SaveChangesAsync(cancellationToken);

            cache.Set(cacheKey, true, TimeSpan.FromMinutes(2));
            return true;
        }

        if (session.LastActiveAt < now.AddMinutes(-5))
        {
            session.LastActiveAt = now;
            session.UpdatedAt = now;
            await db.SaveChangesAsync(cancellationToken);
        }

        var isRevoked = session.IsRevoked;

        // Cache for 2 minutes
        cache.Set(cacheKey, isRevoked, TimeSpan.FromMinutes(2));

        return isRevoked;
    }

    public void InvalidateSessionCache(string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId)) return;
        var cacheKey = CachePrefix + sessionId;
        cache.Remove(cacheKey);
    }
}

