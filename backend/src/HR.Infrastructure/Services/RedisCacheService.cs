using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

/// <summary>
/// Hybrid Cache Service kết hợp MemoryCache (L1) và Distributed Cache / Redis (L2)
/// Hỗ trợ xoá cache theo tiền tố (Prefix Invalidation) và tự động fallback nếu ngắt kết nối.
/// </summary>
public class RedisCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<RedisCacheService> _logger;
    private static readonly ConcurrentDictionary<string, byte> _trackedKeys = new(StringComparer.OrdinalIgnoreCase);

    public RedisCacheService(
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        ILogger<RedisCacheService> logger)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key)) return default;

        // L1 Cache: MemoryCache
        if (_memoryCache.TryGetValue(key, out T? cachedValue))
        {
            return cachedValue;
        }

        // L2 Cache: IDistributedCache / Redis
        try
        {
            var json = await _distributedCache.GetStringAsync(key, cancellationToken);
            if (!string.IsNullOrEmpty(json))
            {
                var val = JsonSerializer.Deserialize<T>(json);
                if (val != null)
                {
                    _memoryCache.Set(key, val, TimeSpan.FromMinutes(5));
                    _trackedKeys.TryAdd(key, 0);
                    return val;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[CACHE] Failed to read from distributed cache key: {Key}", key);
        }

        return default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key) || value == null) return;

        var exp = expiration ?? TimeSpan.FromMinutes(15);

        // Populate L1 MemoryCache
        _memoryCache.Set(key, value, exp);
        _trackedKeys.TryAdd(key, 0);

        // Populate L2 DistributedCache
        try
        {
            var json = JsonSerializer.Serialize(value);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = exp
            };
            await _distributedCache.SetStringAsync(key, json, options, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[CACHE] Failed to set distributed cache key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key)) return;

        _memoryCache.Remove(key);
        _trackedKeys.TryRemove(key, out _);

        try
        {
            await _distributedCache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[CACHE] Failed to remove distributed cache key: {Key}", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(prefix)) return;

        var keysToRemove = _trackedKeys.Keys
            .Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .ToList();

        foreach (var key in keysToRemove)
        {
            await RemoveAsync(key, cancellationToken);
        }
    }
}
