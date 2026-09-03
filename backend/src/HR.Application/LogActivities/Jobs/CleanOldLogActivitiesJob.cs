using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;

namespace HR.Application.LogActivities.Jobs;

public class CleanOldLogActivitiesJob(IApplicationDbContext context)
{
    public async Task CleanLogsAsync()
    {
        // 1. Dọn dẹp log quá 90 ngày
        var thresholdDate = DateTime.Now.AddDays(-90);
        var oldLogs = await context.LogActivities
            .Where(x => x.CreatedAt < thresholdDate)
            .ToListAsync();

        if (oldLogs.Count > 0)
        {
            context.LogActivities.RemoveRange(oldLogs);
            await context.SaveChangesAsync(default);
        }

        // 2. Giới hạn lưu trữ tối đa 500,000 bản ghi nóng (hot logs)
        var totalLogs = await context.LogActivities.CountAsync();
        const int limit = 500000;
        if (totalLogs > limit)
        {
            var excess = totalLogs - limit;
            var excessLogs = await context.LogActivities
                .OrderBy(x => x.CreatedAt)
                .Take(excess)
                .ToListAsync();

            if (excessLogs.Count > 0)
            {
                context.LogActivities.RemoveRange(excessLogs);
                await context.SaveChangesAsync(default);
            }
        }

        // 3. Dọn dẹp log trạng thái trực tuyến (presence logs) quá 30 ngày
        var presenceThresholdDate = DateTime.Now.AddDays(-30);
        var oldPresenceLogs = await context.UserPresenceLogs
            .Where(x => x.LoginTime < presenceThresholdDate)
            .ToListAsync();

        if (oldPresenceLogs.Count > 0)
        {
            context.UserPresenceLogs.RemoveRange(oldPresenceLogs);
            await context.SaveChangesAsync(default);
        }
    }
}

