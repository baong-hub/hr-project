using System.Text.Json;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HR.Application.Common.Behaviors;

public class ActivityLogBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IActivityLogService _activityLogService;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<ActivityLogBehavior<TRequest, TResponse>> _logger;

    public ActivityLogBehavior(
        IActivityLogService activityLogService,
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<ActivityLogBehavior<TRequest, TResponse>> logger)
    {
        _activityLogService = activityLogService;
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (request is not IAuditableCommand auditableCommand || auditableCommand.SkipAudit)
        {
            return await next();
        }

        // Skip logging if this is the initial load from menu/tab
        var isInitialLoadProp = request.GetType().GetProperty("IsInitialLoad");
        if (isInitialLoadProp != null && isInitialLoadProp.PropertyType == typeof(bool))
        {
            var isInitial = (bool)isInitialLoadProp.GetValue(request)!;
            if (isInitial)
            {
                return await next();
            }
        }

        if (auditableCommand.AuditAction == "SEARCH" && !HasActiveSearchFilters(request))
        {
            return await next();
        }

        string? beforeValue = null;

        // Bắt giá trị trước khi Handler chạy (chỉ cần cho UPDATE/DELETE)
        if (auditableCommand.AuditAction == "UPDATE" || auditableCommand.AuditAction == "DELETE")
        {
            if (auditableCommand.EntityId.HasValue)
            {
                beforeValue = await _activityLogService.GetEntitySnapshotAsync(auditableCommand.ModuleName, auditableCommand.EntityId.Value, cancellationToken);
            }
        }

        // Chạy Handler
        var response = await next();

        // Kiểm tra nếu response là ApiResponse và thao tác thất bại (Success=false)
        // thì không ghi audit log (ví dụ BR-04: trùng lịch hẹn → Data=0, không có entity thật)
        if (IsFailedApiResponse(response))
        {
            return response;
        }

        // Lấy thông tin user hiện tại
        int? userId = _currentUserService.UserId > 0 ? (int?)_currentUserService.UserId : null;

        string? afterValue = null;

        // Bắt giá trị sau khi Handler chạy (chỉ cần cho CREATE/UPDATE)
        if (auditableCommand.AuditAction == "CREATE" || auditableCommand.AuditAction == "UPDATE")
        {
            int? entityIdToQuery = null;

            // Nếu là CREATE, response thường là Id của record mới.
            if (auditableCommand.AuditAction == "CREATE" && auditableCommand.EntityId == null)
            {
                // Cố gắng lấy ID từ response nếu response có property Id (ví dụ: ApiResponse<int> hay ApiResponse<AppointmentDto>)
                entityIdToQuery = TryExtractIdFromResponse(response);
            }
            else
            {
                entityIdToQuery = auditableCommand.EntityId;
            }

            if (entityIdToQuery.HasValue && entityIdToQuery.Value > 0)
            {
                afterValue = await _activityLogService.GetEntitySnapshotAsync(auditableCommand.ModuleName, entityIdToQuery.Value, cancellationToken);
            }
        }
        else if (auditableCommand.AuditAction == "SEARCH")
        {
            var conditions = new Dictionary<string, object?>();
            var properties = request.GetType().GetProperties();
            foreach (var prop in properties)
            {
                var name = prop.Name;
                if (name == "ModuleName" || name == "EntityId" || name == "AuditAction" || name == "SkipAudit" ||
                    name == "Page" || name == "PageSize" || name == "PageNumber" || name == "PageIndex" ||
                    name == "OrderBy" || name == "IsDescending" || name == "IsInitialLoad")
                {
                    continue;
                }

                try
                {
                    var val = prop.GetValue(request);
                    if (val != null)
                    {
                        if (val is string str && string.IsNullOrWhiteSpace(str)) continue;
                        conditions[name] = val;
                    }
                }
                catch {}
            }

            int totalRecords = 0;
            if (response != null)
            {
                var responseType = response.GetType();
                var totalProp = responseType.GetProperty("Total") ?? responseType.GetProperty("TotalCount") ?? responseType.GetProperty("TotalItems");
                if (totalProp != null)
                {
                    totalRecords = Convert.ToInt32(totalProp.GetValue(response));
                }
                else
                {
                    var dataProp = responseType.GetProperty("Data");
                    if (dataProp != null)
                    {
                        var dataVal = dataProp.GetValue(response);
                        if (dataVal != null)
                        {
                            var dataType = dataVal.GetType();
                            var dataTotalProp = dataType.GetProperty("Total") ?? dataType.GetProperty("TotalCount") ?? dataType.GetProperty("TotalItems");
                            if (dataTotalProp != null)
                            {
                                totalRecords = Convert.ToInt32(dataTotalProp.GetValue(dataVal));
                            }
                        }
                    }
                }
            }

            var searchLogObj = new {
                SearchConditions = conditions,
                TotalRecords = totalRecords
            };
            afterValue = JsonSerializer.Serialize(searchLogObj);
        }

        // Ghi log
        try
        {
            // Note: with CREATE, if we could not extract EntityId from response, entityId will be null in log, but values might be empty.
            // Ideally entityId is extracted.
            int? finalEntityId = auditableCommand.EntityId ?? TryExtractIdFromResponse(response);

            // Bỏ qua nếu entityId = 0 hoặc null (đối với CREATE/UPDATE/DELETE/VIEW)
            var needsEntityId = new[] { "CREATE", "UPDATE", "DELETE", "VIEW" }.Contains(auditableCommand.AuditAction);
            if (needsEntityId && (!finalEntityId.HasValue || finalEntityId.Value <= 0))
            {
                _logger.LogWarning("Skipped activity log for {ModuleName} {AuditAction} - no valid EntityId", auditableCommand.ModuleName, auditableCommand.AuditAction);
                return response;
            }

            await _activityLogService.LogAsync(
                auditableCommand.ModuleName,
                finalEntityId > 0 ? finalEntityId : null,
                auditableCommand.AuditAction,
                userId,
                beforeValue,
                afterValue,
                cancellationToken);
        }
        catch (Exception ex)
        {
            // Tránh việc lỗi ghi log làm crash cả ứng dụng
            _logger.LogError(ex, "Failed to log activity for {ModuleName} {EntityId}", auditableCommand.ModuleName, auditableCommand.EntityId);
        }

        return response;
    }

    private int? TryExtractIdFromResponse(TResponse response)
    {
        if (response == null) return null;

        // 1. If the response itself is numeric (int/long)
        if (response is int directInt) return directInt;
        if (response is long directLong) return (int)directLong;

        var responseType = response.GetType();

        // 2. Try to get Id from Data property (in case of ApiResponse<T>)
        var dataProperty = responseType.GetProperty("Data");
        if (dataProperty != null)
        {
            var dataValue = dataProperty.GetValue(response);
            if (dataValue != null)
            {
                if (dataValue is int intVal) return intVal;
                if (dataValue is long longVal) return (int)longVal;

                var dataType = dataValue.GetType();
                var idProperty = dataType.GetProperty("Id");
                if (idProperty != null)
                {
                    var idValue = idProperty.GetValue(dataValue);
                    if (idValue is int i) return i;
                    if (idValue is long l) return (int)l;
                }
            }
        }

        // 3. Try to get Id property from response itself (in case of raw DTO)
        var directIdProp = responseType.GetProperty("Id");
        if (directIdProp != null)
        {
            var idValue = directIdProp.GetValue(response);
            if (idValue is int i) return i;
            if (idValue is long l) return (int)l;
        }

        return null;
    }

    private bool IsFailedApiResponse(TResponse response)
    {
        if (response == null) return false;

        var responseType = response.GetType();
        var successProperty = responseType.GetProperty("Success");
        if (successProperty != null)
        {
            var successValue = successProperty.GetValue(response);
            if (successValue is bool success && !success)
            {
                return true;
            }
        }

        return false;
    }

    private bool HasActiveSearchFilters(TRequest request)
    {
        if (request == null) return false;

        var properties = request.GetType().GetProperties();
        foreach (var prop in properties)
        {
            var name = prop.Name;
            if (name == "ModuleName" || name == "EntityId" || name == "AuditAction" ||
                name == "Page" || name == "PageSize" || name == "PageNumber" || name == "PageIndex" ||
                name == "OrderBy" || name == "IsDescending")
            {
                continue;
            }

            try
            {
                var value = prop.GetValue(request);
                if (value != null)
                {
                    if (value is string str && !string.IsNullOrWhiteSpace(str))
                    {
                        return true;
                    }
                    
                    if (prop.PropertyType.IsGenericType && prop.PropertyType.GetGenericTypeDefinition() == typeof(Nullable<>))
                    {
                        return true;
                    }

                    if (value is bool b && b)
                    {
                        return true;
                    }
                }
            }
            catch
            {
                // Ignore errors reading properties
            }
        }

        return false;
    }
}

