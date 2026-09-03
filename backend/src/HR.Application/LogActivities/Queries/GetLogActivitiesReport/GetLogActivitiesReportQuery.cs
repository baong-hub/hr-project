using MediatR;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.LogActivities.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HR.Application.LogActivities.Queries.GetLogActivitiesReport;

public record GetLogActivitiesReportQuery(
    string? Search = null,
    string? ModuleName = null,
    string? Action = null,
    int? UserId = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<ApiResponse<PagedResult<LogActivityDto>>>;

public class GetLogActivitiesReportQueryHandler(IApplicationDbContext context) 
    : IRequestHandler<GetLogActivitiesReportQuery, ApiResponse<PagedResult<LogActivityDto>>>
{
    public async Task<ApiResponse<PagedResult<LogActivityDto>>> Handle(GetLogActivitiesReportQuery request, CancellationToken cancellationToken)
    {
        var query = context.LogActivities
            .Include(x => x.User)
            .AsNoTracking();

        // Filters
        if (!string.IsNullOrEmpty(request.ModuleName))
        {
            query = query.Where(x => x.ModuleName == request.ModuleName);
        }

        if (!string.IsNullOrEmpty(request.Action))
        {
            query = query.Where(x => x.Action == request.Action);
        }

        if (request.UserId.HasValue)
        {
            query = query.Where(x => x.UserId == request.UserId.Value);
        }

        if (request.StartDate.HasValue)
        {
            query = query.Where(x => x.CreatedAt >= request.StartDate.Value);
        }

        if (request.EndDate.HasValue)
        {
            query = query.Where(x => x.CreatedAt <= request.EndDate.Value);
        }

        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(x => (x.User != null && x.User.FullName != null && x.User.FullName.ToLower().Contains(search))
                || (x.BeforeValue != null && x.BeforeValue.Contains(request.Search))
                || (x.AfterValue != null && x.AfterValue.Contains(request.Search)));
        }

        var total = await query.CountAsync(cancellationToken);
        
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : request.PageSize;
        if (pageSize > 100) pageSize = 100;

        var logs = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // Prefetch related entity codes & names to display detailed descriptions
        var leadInfo = new Dictionary<int, (string Code, string Name)>();
        var custInfo = new Dictionary<int, (string Code, string Name)>();
        var taskInfo = new Dictionary<int, (string Code, string Name)>();

        // Pre-fetch lookups for user-friendly name resolution of ID values
        var usersDict = await context.Users.Select(x => new { x.Id, x.FullName }).ToDictionaryAsync(x => x.Id, x => x.FullName, cancellationToken);
        var provincesDict = new Dictionary<int, string>();
        var sourcesDict = new Dictionary<int, string>();
        var refSourcesDict = new Dictionary<int, string>();
        var occupationsDict = new Dictionary<int, string>();
        var groupsDict = new Dictionary<int, string>();
        var stagesDict = new Dictionary<int, string>();

        string FormatValue(string key, string? rawValue)
        {
            if (string.IsNullOrEmpty(rawValue) || rawValue == "null" || string.IsNullOrWhiteSpace(rawValue)) return "trống";
            
            var lowerKey = key.ToLower();
            
            if (int.TryParse(rawValue, out int idVal))
            {
                if (lowerKey == "care_staff_id" || lowerKey == "carestaffid" || 
                    lowerKey == "created_by" || lowerKey == "createdby" || 
                    lowerKey == "updated_by" || lowerKey == "updatedby" || 
                    lowerKey == "assignee_id" || lowerKey == "assigneeid")
                {
                    if (usersDict.TryGetValue(idVal, out var name)) return $"{idVal} ({name})";
                }
                else if (lowerKey == "province_id" || lowerKey == "provinceid")
                {
                    if (provincesDict.TryGetValue(idVal, out var name)) return $"{idVal} ({name})";
                }
                else if (lowerKey == "source_id" || lowerKey == "sourceid")
                {
                    if (sourcesDict.TryGetValue(idVal, out var name)) return $"{idVal} ({name})";
                }
                else if (lowerKey == "referral_source_id" || lowerKey == "referralsourceid")
                {
                    if (refSourcesDict.TryGetValue(idVal, out var name)) return $"{idVal} ({name})";
                }
                else if (lowerKey == "occupation_id" || lowerKey == "occupationid")
                {
                    if (occupationsDict.TryGetValue(idVal, out var name)) return $"{idVal} ({name})";
                }
                else if (lowerKey == "customer_group_id" || lowerKey == "customergroupid" || lowerKey == "adv_customer_group" || lowerKey == "advcustomergroup")
                {
                    if (groupsDict.TryGetValue(idVal, out var name)) return $"{idVal} ({name})";
                }
                else if (lowerKey == "pipeline_stage_id" || lowerKey == "pipelinestageid" || lowerKey == "stage_id" || lowerKey == "stageid")
                {
                    if (stagesDict.TryGetValue(idVal, out var name)) return $"{idVal} ({name})";
                }
            }
            
            if (lowerKey == "gender")
            {
                if (rawValue == "1") return "Nam";
                if (rawValue == "2") return "Nữ";
                return "Khác";
            }
            
            return rawValue;
        }

        var items = new List<LogActivityDto>();

        foreach (var log in logs)
        {
            string? entityCode = null;
            string? entityName = null;

            if (log.EntityId.HasValue)
            {
                if (log.ModuleName == "leads" && leadInfo.TryGetValue(log.EntityId.Value, out var li))
                {
                    entityCode = li.Code;
                    entityName = li.Name;
                }
                else if (log.ModuleName == "customers" && custInfo.TryGetValue(log.EntityId.Value, out var ci))
                {
                    entityCode = ci.Code;
                    entityName = ci.Name;
                }
                else if (log.ModuleName == "lead_tasks" && taskInfo.TryGetValue(log.EntityId.Value, out var ti))
                {
                    entityCode = ti.Code;
                    entityName = ti.Name;
                }

                // If DB lookup fails (e.g. deleted), try to parse from serialized values
                if (string.IsNullOrEmpty(entityName))
                {
                    try
                    {
                        var jsonVal = log.BeforeValue ?? log.AfterValue;
                        if (!string.IsNullOrEmpty(jsonVal))
                        {
                            var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(jsonVal);
                            if (dict != null)
                            {
                                if (dict.TryGetValue("FullName", out var fn)) entityName = fn.ToString();
                                else if (dict.TryGetValue("TaskName", out var tn)) entityName = tn.ToString();

                                if (dict.TryGetValue("LeadCode", out var lc)) entityCode = lc.ToString();
                                else if (dict.TryGetValue("CustomerCode", out var cc)) entityCode = cc.ToString();
                                else if (dict.TryGetValue("ManagementCode", out var mc)) entityCode = mc.ToString();
                                else if (dict.TryGetValue("TaskCode", out var tc)) entityCode = tc.ToString();
                            }
                        }
                    }
                    catch {}
                }

                if (string.IsNullOrEmpty(entityName))
                {
                    entityName = $"Bản ghi #{log.EntityId}";
                }
            }

            var dto = new LogActivityDto
            {
                Id = log.Id,
                Action = log.Action,
                CreatedBy = (log.User != null ? log.User.FullName : "Hệ thống") ?? "Hệ thống",
                CreatedAt = log.CreatedAt,
                ModuleName = log.ModuleName,
                EntityId = log.EntityId,
                BeforeValue = log.BeforeValue,
                AfterValue = log.AfterValue,
                EntityCode = entityCode,
                EntityName = entityName,
                IpAddress = log.IpAddress,
                Device = log.Device,
                OperatingSystem = log.OperatingSystem,
                Browser = log.Browser
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
                            var lowerKey = key.ToLower();
                            if (lowerKey == "updatedat" || lowerKey == "updatedby" || 
                                lowerKey == "createdat" || lowerKey == "createdby" || 
                                lowerKey == "updated_at" || lowerKey == "created_at" || 
                                lowerKey == "updated_by" || lowerKey == "created_by" ||
                                lowerKey == "deleted_at" || lowerKey == "is_deleted" ||
                                lowerKey == "is_active")
                                continue;

                            var oldValStr = beforeDict.ContainsKey(key) ? beforeDict[key].ToString() : "";
                            var newValStr = afterDict[key].ToString();

                            if (oldValStr != newValStr)
                            {
                                dto.Changes.Add(new LogActivityChangeDto
                                {
                                    Field = key,
                                    OldValue = FormatValue(key, oldValStr),
                                    NewValue = FormatValue(key, newValStr)
                                });
                            }
                        }
                    }
                }
                catch { }
            }

            if (log.Action == "CREATE")
            {
                dto.Changes.Add(new LogActivityChangeDto { Field = "Hành động", OldValue = "", NewValue = "Tạo mới dữ liệu" });
                if (!string.IsNullOrEmpty(log.AfterValue))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(log.AfterValue);
                        foreach (var prop in doc.RootElement.EnumerateObject())
                        {
                            var lowerPropName = prop.Name.ToLower();
                            if (lowerPropName == "id" || lowerPropName == "createdby" || 
                                lowerPropName == "createdat" || lowerPropName == "updatedby" || 
                                lowerPropName == "updatedat" || lowerPropName == "created_at" || 
                                lowerPropName == "updated_at" || lowerPropName == "created_by" || 
                                lowerPropName == "updated_by" || lowerPropName == "deleted_at" || 
                                lowerPropName == "is_deleted" || lowerPropName == "is_active")
                            {
                                continue;
                            }

                            var valStr = prop.Value.ToString();
                            if (!string.IsNullOrEmpty(valStr))
                            {
                                dto.Changes.Add(new LogActivityChangeDto
                                {
                                    Field = prop.Name,
                                    OldValue = "",
                                    NewValue = FormatValue(prop.Name, valStr)
                                });
                            }
                        }
                    }
                    catch {}
                }
            }
            if (log.Action == "DELETE")
            {
                dto.Changes.Add(new LogActivityChangeDto { Field = "Hành động", OldValue = "Hiện hữu", NewValue = "Đã xóa" });
            }
            if (log.Action == "SEARCH" && !string.IsNullOrEmpty(log.AfterValue))
            {
                try
                {
                    using var doc = JsonDocument.Parse(log.AfterValue);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("SearchConditions", out var condEl) && condEl.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var prop in condEl.EnumerateObject())
                        {
                            dto.Changes.Add(new LogActivityChangeDto
                            {
                                Field = prop.Name,
                                OldValue = "",
                                NewValue = prop.Value.ToString()
                            });
                        }
                    }
                    if (root.TryGetProperty("TotalRecords", out var totalEl))
                    {
                        dto.Changes.Add(new LogActivityChangeDto
                        {
                            Field = "Số lượng kết quả",
                            OldValue = "",
                            NewValue = $"{totalEl} bản ghi"
                        });
                    }
                }
                catch {}
            }

            items.Add(dto);
        }

        var result = new PagedResult<LogActivityDto>
        {
            Items = items,
            Meta = new PagingMeta
            {
                Page = page,
                PageSize = pageSize,
                Total = total
            }
        };

        return ApiResponse<PagedResult<LogActivityDto>>.Ok(result);
    }
}

