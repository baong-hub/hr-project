namespace HR.Application.Common.Interfaces;

public interface IActivityLogService
{
    Task LogAsync(string moduleName, int? entityId, string action,
        int? userId, string? beforeValue, string? afterValue,
        CancellationToken cancellationToken = default);

    Task<string?> GetEntitySnapshotAsync(string moduleName, int entityId, CancellationToken cancellationToken = default);
}

