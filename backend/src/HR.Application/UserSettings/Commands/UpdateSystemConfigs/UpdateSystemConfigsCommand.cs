using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.UserSettings.Commands.UpdateSystemConfigs;

public record UpdateSystemConfigItemDto(string ConfigKey, string ConfigValue);

public record UpdateSystemConfigsCommand(List<UpdateSystemConfigItemDto> Items) : IRequest<ApiResponse<Dictionary<string, string>>>;

public class UpdateSystemConfigsCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateSystemConfigsCommand, ApiResponse<Dictionary<string, string>>>
{
    public async Task<ApiResponse<Dictionary<string, string>>> Handle(UpdateSystemConfigsCommand request, CancellationToken cancellationToken)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            return ApiResponse<Dictionary<string, string>>.Fail("INVALID_INPUT", "Danh sách cấu hình gửi lên không hợp lệ.");
        }

        var keys = request.Items.Select(i => i.ConfigKey).ToList();
        var existingConfigs = await context.SettingConfigs
            .Where(s => keys.Contains(s.ConfigKey))
            .ToListAsync(cancellationToken);

        var now = DateTime.Now;
        foreach (var item in request.Items)
        {
            var config = existingConfigs.FirstOrDefault(c => c.ConfigKey == item.ConfigKey);
            if (config != null)
            {
                config.ConfigValue = item.ConfigValue;
                config.UpdatedAt = now;
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        var allConfigs = await context.SettingConfigs
            .AsNoTracking()
            .ToDictionaryAsync(s => s.ConfigKey, s => s.ConfigValue, cancellationToken);

        return ApiResponse<Dictionary<string, string>>.Ok(allConfigs);
    }
}

