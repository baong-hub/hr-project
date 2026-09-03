using MediatR;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.LogActivities.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HR.Application.LogActivities.Queries.GetLogActivities;

public record GetLogActivitiesQuery(string ModuleName, int EntityId) : IRequest<ApiResponse<List<LogActivityDto>>>;

public class GetLogActivitiesHandler : IRequestHandler<GetLogActivitiesQuery, ApiResponse<List<LogActivityDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetLogActivitiesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<LogActivityDto>>> Handle(GetLogActivitiesQuery request, CancellationToken cancellationToken)
    {
        var logs = await _context.LogActivities
            .Include(x => x.User)
            .Where(x => x.ModuleName == request.ModuleName && x.EntityId == request.EntityId)
            .OrderByDescending(x => x.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var result = new List<LogActivityDto>();

        foreach (var log in logs)
        {
            var dto = new LogActivityDto
            {
                Id = log.Id,
                Action = log.Action,
                CreatedBy = (log.User != null ? log.User.FullName : "Hệ thống") ?? "Hệ thống",
                CreatedAt = log.CreatedAt,
                ModuleName = log.ModuleName,
                EntityId = log.EntityId,
                BeforeValue = log.BeforeValue,
                AfterValue = log.AfterValue
            };

            // Parse changes if action is UPDATE
            if (log.Action == "UPDATE" && !string.IsNullOrEmpty(log.BeforeValue) && !string.IsNullOrEmpty(log.AfterValue))
            {
                try
                {
                    var beforeDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(log.BeforeValue);
                    var afterDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(log.AfterValue);

                    if (beforeDict != null && afterDict != null)
                    {
                        foreach (var key in afterDict.Keys)
                        {
                            // Skip common properties
                            if (key == "UpdatedAt" || key == "UpdatedBy" || key == "CreatedAt" || key == "CreatedBy")
                                continue;

                            var oldValStr = beforeDict.ContainsKey(key) ? beforeDict[key].ToString() : "";
                            var newValStr = afterDict[key].ToString();

                            if (oldValStr != newValStr)
                            {
                                dto.Changes.Add(new LogActivityChangeDto
                                {
                                    Field = key,
                                    OldValue = oldValStr,
                                    NewValue = newValStr
                                });
                            }
                        }
                    }
                }
                catch
                {
                    // Ignore parsing errors
                }
            }
            
            // Log creation
            if (log.Action == "CREATE")
            {
                dto.Changes.Add(new LogActivityChangeDto
                {
                    Field = "Hành động",
                    OldValue = "",
                    NewValue = "Tạo mới dữ liệu"
                });
            }

            // Log deletion
            if (log.Action == "DELETE")
            {
                dto.Changes.Add(new LogActivityChangeDto
                {
                    Field = "Hành động",
                    OldValue = "Hiện hữu",
                    NewValue = "Đã xóa"
                });
            }

            result.Add(dto);
        }

        return ApiResponse<List<LogActivityDto>>.Ok(result);
    }
}

