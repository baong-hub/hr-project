using System.Collections.Concurrent;
using HR.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HR.Infrastructure.Services;

public class SettingService : ISettingService
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private const string CachePrefix = "setting_";
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(10);
    private static readonly ConcurrentDictionary<string, byte> CachedKeys = new();

    public SettingService(IApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<string> GetValueAsync(string key, int? siteId = null)
    {
        string cacheKey = $"{CachePrefix}{key}_{siteId ?? 0}";

        if (_cache.TryGetValue(cacheKey, out string? cachedValue) && cachedValue != null)
        {
            return cachedValue;
        }

        // Ưu tiên SiteId -> Fallback SiteId = null (Global)
        var configs = await _context.SettingConfigs
            .Where(x => x.ConfigKey == key && (x.SiteId == siteId || x.SiteId == null))
            .OrderByDescending(x => x.SiteId) // SiteId có giá trị sẽ lên đầu (OrderByDescending vì null < int)
            .Select(x => x.ConfigValue)
            .ToListAsync();

        var value = configs.FirstOrDefault() ?? string.Empty;

        _cache.Set(cacheKey, value, _cacheDuration);
        CachedKeys.TryAdd(cacheKey, 0);

        return value;
    }

    public async Task<bool> GetBoolAsync(string key, int? siteId = null)
    {
        var value = await GetValueAsync(key, siteId);
        return bool.TryParse(value, out var result) && result;
    }

    public async Task<int> GetIntAsync(string key, int? siteId = null)
    {
        var value = await GetValueAsync(key, siteId);
        return int.TryParse(value, out var result) ? result : 0;
    }

    public async Task<decimal> GetDecimalAsync(string key, int? siteId = null)
    {
        var value = await GetValueAsync(key, siteId);
        return decimal.TryParse(value, out var result) ? result : 0m;
    }

    public void ClearCache()
    {
        foreach (var key in CachedKeys.Keys)
        {
            _cache.Remove(key);
        }
        CachedKeys.Clear();
    }
}


