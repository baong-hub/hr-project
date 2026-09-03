using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.UserSettings.Queries.GetSystemConfigsGrouped;

public record SystemConfigDto(
    int Id,
    string ConfigKey,
    string ConfigValue,
    string? Group,
    string? Description,
    DateTime UpdatedAt
);

public record SystemConfigGroupDto(
    string GroupName,
    List<SystemConfigDto> Items
);

public record GetSystemConfigsGroupedQuery() : IRequest<List<SystemConfigGroupDto>>;

public class GetSystemConfigsGroupedQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetSystemConfigsGroupedQuery, List<SystemConfigGroupDto>>
{
    public async Task<List<SystemConfigGroupDto>> Handle(GetSystemConfigsGroupedQuery request, CancellationToken cancellationToken)
    {
        var allConfigs = await context.SettingConfigs
            .AsNoTracking()
            .OrderBy(s => s.Group)
            .ThenBy(s => s.ConfigKey)
            .Select(s => new SystemConfigDto(
                s.Id,
                s.ConfigKey,
                s.ConfigValue,
                string.IsNullOrWhiteSpace(s.Group) ? "Khác" : s.Group,
                s.Description,
                s.UpdatedAt
            ))
            .ToListAsync(cancellationToken);

        var grouped = allConfigs
            .GroupBy(c => c.Group ?? "Khác")
            .Select(g => new SystemConfigGroupDto(
                GroupName: g.Key,
                Items: g.ToList()
            ))
            .OrderBy(g => g.GroupName == "System" ? 0 : g.GroupName == "SMTP" ? 1 : 2)
            .ThenBy(g => g.GroupName)
            .ToList();

        return grouped;
    }
}

