using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

public class JobExpiryService(
    IApplicationDbContext context,
    ILogger<JobExpiryService> logger) : IJobExpiryService
{
    public async Task<int> CloseExpiredJobsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var now = DateTime.UtcNow;
            var expiredJobs = await context.Jobs
                .Where(j => j.Status == JobStatus.PUBLISHED 
                         && j.ExpiredAt < now 
                         && j.DeletedAt == null)
                .ToListAsync(cancellationToken);

            if (!expiredJobs.Any())
            {
                logger.LogInformation("[HANGFIRE] Quét tin tuyển dụng hết hạn: Không có tin nào quá hạn tại {Time}", now);
                return 0;
            }

            foreach (var job in expiredJobs)
            {
                job.Status = JobStatus.EXPIRED;
                job.UpdatedAt = now;
            }

            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("[HANGFIRE] Đã tự động chuyển trạng thái {Count} tin tuyển dụng hết hạn sang EXPIRED", expiredJobs.Count);
            return expiredJobs.Count;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[HANGFIRE] Lỗi khi thực hiện quét tin tuyển dụng hết hạn.");
            throw;
        }
    }
}
