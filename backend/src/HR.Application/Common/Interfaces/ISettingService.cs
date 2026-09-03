namespace HR.Application.Common.Interfaces;

public interface ISettingService
{
    Task<string> GetValueAsync(string key, int? siteId = null);
    Task<bool> GetBoolAsync(string key, int? siteId = null);
    Task<int> GetIntAsync(string key, int? siteId = null);
    Task<decimal> GetDecimalAsync(string key, int? siteId = null);
    
    // Clear cache if implemented
    void ClearCache();
}

