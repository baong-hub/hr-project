using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;

namespace HR.Infrastructure.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _httpContextAccessor;

    public ActivityLogService(
        IApplicationDbContext context, 
        IDateTimeProvider dateTime,
        Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _dateTime = dateTime;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string moduleName, int? entityId, string action, int? userId, string? beforeValue, string? afterValue, CancellationToken cancellationToken = default)
    {
        if (action == "UPDATE" && entityId.HasValue && userId.HasValue)
        {
            var cutoffTime = _dateTime.Now.AddMinutes(-2);
            var existingLog = await _context.LogActivities
                .Where(x => x.ModuleName == moduleName && x.EntityId == entityId && x.Action == "UPDATE" && x.UserId == userId && x.CreatedAt >= cutoffTime)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingLog != null)
            {
                existingLog.AfterValue = EnsureJson(afterValue);
                existingLog.UpdatedAt = _dateTime.Now;
                existingLog.CreatedAt = _dateTime.Now;
                await _context.SaveChangesAsync(cancellationToken);
                return;
            }
        }

        var httpContext = _httpContextAccessor.HttpContext;
        string? ipAddress = null;
        string? device = null;
        string? os = null;
        string? browser = null;

        if (httpContext != null)
        {
            // Resolve real client IP behind proxy
            if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
            {
                ipAddress = forwarded.ToString().Split(',')[0].Trim();
            }
            else
            {
                ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            }

            // Parse User Agent
            var userAgent = httpContext.Request.Headers["User-Agent"].ToString();
            var uaParsed = ParseUserAgent(userAgent);
            device = uaParsed.Device;
            os = uaParsed.OS;
            browser = uaParsed.Browser;
        }

        var log = new LogActivity
        {
            ModuleName = moduleName,
            EntityId = entityId,
            Action = action,
            UserId = userId,
            BeforeValue = EnsureJson(beforeValue),
            AfterValue = EnsureJson(afterValue),
            IpAddress = ipAddress,
            Device = device,
            OperatingSystem = os,
            Browser = browser,
            CreatedAt = _dateTime.Now,
            UpdatedAt = _dateTime.Now
        };

        _context.LogActivities.Add(log);
        
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static (string Device, string OS, string Browser) ParseUserAgent(string? userAgent)
    {
        if (string.IsNullOrEmpty(userAgent))
        {
            return ("Unknown", "Unknown", "Unknown");
        }

        var ua = userAgent.ToLower();

        // 1. Device
        var device = "Computer";
        if (ua.Contains("ipad") || ua.Contains("tablet") || (ua.Contains("android") && !ua.Contains("mobile")))
        {
            device = "Tablet";
        }
        else if (ua.Contains("mobile") || ua.Contains("iphone") || ua.Contains("android") || ua.Contains("windows phone"))
        {
            device = "Mobile";
        }

        // 2. OS
        var os = "Unknown";
        if (ua.Contains("windows nt"))
        {
            if (ua.Contains("windows nt 10.0")) os = "Windows 10/11";
            else if (ua.Contains("windows nt 6.3")) os = "Windows 8.1";
            else if (ua.Contains("windows nt 6.2")) os = "Windows 8";
            else if (ua.Contains("windows nt 6.1")) os = "Windows 7";
            else os = "Windows";
        }
        else if (ua.Contains("mac os x"))
        {
            if (ua.Contains("iphone") || ua.Contains("ipad") || ua.Contains("ipod")) os = "iOS";
            else os = "macOS";
        }
        else if (ua.Contains("android"))
        {
            os = "Android";
        }
        else if (ua.Contains("linux"))
        {
            os = "Linux";
        }

        // 3. Browser
        var browser = "Unknown";
        if (ua.Contains("edg/")) browser = "Edge";
        else if (ua.Contains("chrome") && ua.Contains("safari") && !ua.Contains("chromium"))
        {
            if (ua.Contains("coc_coc_browser")) browser = "Cốc Cốc";
            else browser = "Chrome";
        }
        else if (ua.Contains("safari") && !ua.Contains("chrome")) browser = "Safari";
        else if (ua.Contains("firefox")) browser = "Firefox";
        else if (ua.Contains("opera") || ua.Contains("opr/")) browser = "Opera";
        else if (ua.Contains("trident") || ua.Contains("msie")) browser = "Internet Explorer";

        return (device, os, browser);
    }

    public async Task<string?> GetEntitySnapshotAsync(string moduleName, int entityId, CancellationToken cancellationToken = default)
    {
        try
        {
            var dbContext = _context as Microsoft.EntityFrameworkCore.DbContext;
            if (dbContext == null) return null;

            var connection = dbContext.Database.GetDbConnection();
            bool wasClosed = connection.State == System.Data.ConnectionState.Closed;
            if (wasClosed) await connection.OpenAsync(cancellationToken);

            try
            {
                using var command = connection.CreateCommand();
                if (!System.Text.RegularExpressions.Regex.IsMatch(moduleName, @"^[a-zA-Z0-9_]+$"))
                    return null;

                command.CommandText = $"SELECT * FROM {moduleName} WHERE id = @id";
                var param = command.CreateParameter();
                param.ParameterName = "@id";
                param.Value = entityId;
                command.Parameters.Add(param);

                using var reader = await command.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    var dict = new Dictionary<string, object?>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var name = reader.GetName(i);
                        var lowerName = name.ToLower();
                        if (lowerName == "created_at" || lowerName == "updated_at" || 
                            lowerName == "created_by" || lowerName == "updated_by" || 
                            lowerName == "deleted_at" || lowerName == "is_deleted" || 
                            lowerName == "is_active")
                        {
                            continue;
                        }
                        var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                        dict[name] = value;
                    }
                    return System.Text.Json.JsonSerializer.Serialize(dict, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                }
            }
            finally
            {
                if (wasClosed) await connection.CloseAsync();
            }
        }
        catch (Exception)
        {
            // Log if needed
        }

        return null;
    }
    private static string? EnsureJson(string? value)
    {
        if (string.IsNullOrEmpty(value)) return null;
        
        // Nếu đã là JSON (bắt đầu bằng { hoặc [ hoặc ") thì giữ nguyên
        var trimmed = value.Trim();
        if ((trimmed.StartsWith("{") && trimmed.EndsWith("}")) || 
            (trimmed.StartsWith("[") && trimmed.EndsWith("]")) ||
            (trimmed.StartsWith("\"") && trimmed.EndsWith("\"")))
        {
            return value;
        }

        // Nếu là chuỗi thuần, bọc lại thành JSON string
        return System.Text.Json.JsonSerializer.Serialize(value);
    }
}

