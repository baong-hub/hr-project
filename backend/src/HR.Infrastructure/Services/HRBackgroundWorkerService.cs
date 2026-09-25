using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

/// <summary>
/// Background worker thay thế Hangfire để xử lý các tác vụ định kỳ của hệ thống:
/// - Tự động cập nhật tin tuyển dụng hết hạn (Job deadline)
/// - Quản lý và hạ cấp gói dịch vụ doanh nghiệp khi hết hạn (Subscription expiration)
/// - Quét lịch phỏng vấn sắp diễn ra để nhắc nhở ứng viên & nhà tuyển dụng
/// - Dọn dẹp token hết hạn / revoked trong cơ sở dữ liệu
/// </summary>
public class HRBackgroundWorkerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<HRBackgroundWorkerService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(15);

    public HRBackgroundWorkerService(
        IServiceScopeFactory scopeFactory,
        ILogger<HRBackgroundWorkerService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HRBackgroundWorkerService has started.");

        // Chờ 5 giây sau khi ứng dụng khởi động xong trước khi chạy vòng lặp đầu tiên
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

                await ProcessExpiredJobsAsync(context, stoppingToken);
                await ProcessExpiredSubscriptionsAsync(context, stoppingToken);
                await ProcessInterviewRemindersAsync(context, stoppingToken);
                await ProcessTokenCleanupAsync(context, stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong quá trình thực thi background worker.");
            }

            try
            {
                await Task.Delay(_checkInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("HRBackgroundWorkerService is stopping.");
    }

    private async Task ProcessExpiredJobsAsync(IApplicationDbContext context, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var expiredJobs = await context.Jobs
            .Where(j => j.ExpiredAt != default && j.ExpiredAt < now && j.Status == JobStatus.PUBLISHED && j.DeletedAt == null)
            .ToListAsync(cancellationToken);

        if (expiredJobs.Any())
        {
            foreach (var job in expiredJobs)
            {
                job.Status = JobStatus.EXPIRED;
            }

            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Background Worker: Đã tự động cập nhật {Count} tin tuyển dụng hết hạn sang trạng thái EXPIRED.", expiredJobs.Count);
        }
    }

    private async Task ProcessExpiredSubscriptionsAsync(IApplicationDbContext context, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var expiredSubs = await context.CompanySubscriptions
            .Where(s => s.EndDate < now && s.PlanName != SubscriptionPlan.FREE && s.DeletedAt == null)
            .ToListAsync(cancellationToken);

        if (expiredSubs.Any())
        {
            foreach (var sub in expiredSubs)
            {
                sub.PlanName = SubscriptionPlan.FREE;
                sub.MaxJobs = 3;
                sub.MaxCvViews = 10;
                sub.MaxRecruiters = 1;
                sub.AiScreening = false;
            }

            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Background Worker: Đã tự động hạ cấp {Count} gói dịch vụ doanh nghiệp đã hết hạn về gói FREE.", expiredSubs.Count);
        }
    }

    private async Task ProcessInterviewRemindersAsync(IApplicationDbContext context, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var upcomingWindow = now.AddHours(24);

        var upcomingInterviews = await context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Candidate)
            .Include(i => i.Interviewer)
                .ThenInclude(iv => iv.User)
            .Where(i => i.StartTime >= now && i.StartTime <= upcomingWindow 
                     && i.Status == InterviewStatus.INTERVIEW_SCHEDULED 
                     && i.DeletedAt == null)
            .ToListAsync(cancellationToken);

        if (upcomingInterviews.Any())
        {
            _logger.LogInformation("Background Worker: Có {Count} lịch phỏng vấn sắp diễn ra trong 24 giờ tới.", upcomingInterviews.Count);
        }
    }

    private async Task ProcessTokenCleanupAsync(IApplicationDbContext context, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var expiredTokens = await context.RefreshTokens
            .Where(t => t.ExpiresAt < now.AddDays(-7) || t.IsRevoked)
            .ToListAsync(cancellationToken);

        if (expiredTokens.Any())
        {
            context.RefreshTokens.RemoveRange(expiredTokens);
            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Background Worker: Đã dọn dẹp {Count} Refresh Token hết hạn hoặc đã thu hồi.", expiredTokens.Count);
        }

        var expiredUsers = await context.Users
            .Where(u => u.PasswordResetTokenExpiresAt.HasValue && u.PasswordResetTokenExpiresAt.Value < now)
            .ToListAsync(cancellationToken);

        if (expiredUsers.Any())
        {
            foreach (var u in expiredUsers)
            {
                u.PasswordResetToken = null;
                u.PasswordResetTokenExpiresAt = null;
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
