using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

public class InterviewReminderService(
    IApplicationDbContext context,
    IEmailService emailService,
    ILogger<InterviewReminderService> logger) : IInterviewReminderService
{
    public async Task<int> SendUpcomingInterviewRemindersAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var now = DateTime.Now;
            var upcomingThreshold = now.AddHours(2.5); // Quét các buổi phỏng vấn diễn ra trong 2-2.5h tới

            var upcomingInterviews = await context.Interviews
                .Include(i => i.Application)
                    .ThenInclude(a => a.Candidate)
                        .ThenInclude(c => c.User)
                .Include(i => i.Application)
                    .ThenInclude(a => a.Job)
                        .ThenInclude(j => j.Company)
                .Include(i => i.Interviewer)
                    .ThenInclude(e => e.User)
                .Where(i => i.DeletedAt == null &&
                            (i.Status == InterviewStatus.INTERVIEW_SCHEDULED || i.Status == InterviewStatus.INTERVIEW_INVITATION) &&
                            i.StartTime >= now &&
                            i.StartTime <= upcomingThreshold)
                .ToListAsync(cancellationToken);

            if (!upcomingInterviews.Any())
            {
                logger.LogInformation("[HANGFIRE] Quét nhắc lịch phỏng vấn: Không có lịch nào trong 2 giờ tới tại {Time}", now);
                return 0;
            }

            int sentCount = 0;
            foreach (var interview in upcomingInterviews)
            {
                var candidateUser = interview.Application?.Candidate?.User;
                var candidateEmail = candidateUser?.Email;
                var candidateName = candidateUser?.FullName ?? "Ứng viên";
                var jobTitle = interview.Application?.Job?.Title ?? "Vị trí ứng tuyển";
                var companyName = interview.Application?.Job?.Company?.Name ?? "Doanh nghiệp tuyển dụng";
                var location = !string.IsNullOrWhiteSpace(interview.LocationOrLink) ? interview.LocationOrLink : "Trực tuyến / Văn phòng công ty";

                if (!string.IsNullOrWhiteSpace(candidateEmail))
                {
                    var subject = $"[Nhắc Lịch] Buổi phỏng vấn vị trí {jobTitle} tại {companyName} sẽ bắt đầu sau 2 giờ nữa";
                    var body = $@"
                        <div style=""font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; background: #ffffff;"">
                            <div style=""text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px;"">
                                <span style=""background: #fef3c7; color: #d97706; font-weight: 600; padding: 4px 12px; border-radius: 20px; font-size: 13px;"">Nhắc Hẹn Phỏng Vấn</span>
                                <h2 style=""color: #0f172a; margin: 12px 0 6px;"">Buổi Phỏng Vấn Sắp Bắt Đầu</h2>
                                <p style=""color: #64748b; font-size: 14px; margin: 0;"">Hệ thống gửi thư tự động nhắc lịch hẹn</p>
                            </div>
                            <p>Xin chào <strong>{candidateName}</strong>,</p>
                            <p>Đây là thư nhắc nhở rằng bạn có một buổi phỏng vấn sắp diễn ra trong vòng <strong>2 giờ tới</strong>:</p>
                            <div style=""background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #c9a961; border-radius: 8px; padding: 18px; margin: 20px 0;"">
                                <p style=""margin: 0 0 8px;""><strong>Vị trí ứng tuyển:</strong> <span style=""color: #2563eb;"">{jobTitle}</span></p>
                                <p style=""margin: 0 0 8px;""><strong>Doanh nghiệp:</strong> {companyName}</p>
                                <p style=""margin: 0 0 8px;""><strong>Thời gian:</strong> <span style=""color: #d97706; font-weight: bold;"">{interview.StartTime:dd/MM/yyyy HH:mm} - {interview.EndTime:HH:mm}</span></p>
                                <p style=""margin: 0 0 8px;""><strong>Hình thức:</strong> {interview.InterviewType}</p>
                                <p style=""margin: 0;""><strong>Địa điểm / Link Meet:</strong> <a href=""{location}"" style=""color: #2563eb; text-decoration: underline;"">{location}</a></p>
                            </div>
                            <p style=""font-size: 13px; color: #64748b;"">Vui lòng kiểm tra đường truyền kết nối mạng, micro, camera và chuẩn bị tinh thần tốt nhất cho buổi phỏng vấn.</p>
                            <div style=""margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;"">
                                Cổng Thông Tin Việc Làm & Tuyển Dụng Nhân Sự HR Portal
                            </div>
                        </div>";

                    await emailService.SendEmailAsync(candidateEmail, subject, body, cancellationToken);
                    sentCount++;
                }

                // Gửi thông báo cho Interviewer nếu có email
                var interviewerUser = interview.Interviewer?.User;
                if (!string.IsNullOrWhiteSpace(interviewerUser?.Email) && interviewerUser.Email != candidateEmail)
                {
                    var subject = $"[Nhắc Lịch Phỏng Vấn] Ứng viên {candidateName} - {jobTitle} lúc {interview.StartTime:HH:mm}";
                    var body = $@"
                        <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                            <h3 style=""color: #c9a961; margin-top: 0;"">Nhắc Lịch Phỏng Vấn Tuyển Dụng</h3>
                            <p>Xin chào <strong>{interviewerUser.FullName}</strong>,</p>
                            <p>Bạn có lịch phỏng vấn ứng viên <strong>{candidateName}</strong> cho vị trí <strong>{jobTitle}</strong> vào lúc <strong>{interview.StartTime:dd/MM/yyyy HH:mm}</strong>.</p>
                            <p>Địa điểm / Đường dẫn: <a href=""{location}"">{location}</a></p>
                        </div>";
                    await emailService.SendEmailAsync(interviewerUser.Email, subject, body, cancellationToken);
                }
            }

            logger.LogInformation("[HANGFIRE] Đã gửi {Count} email nhắc lịch hẹn phỏng vấn thành công.", sentCount);
            return sentCount;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[HANGFIRE] Lỗi khi thực hiện quét gửi nhắc lịch hẹn phỏng vấn.");
            throw;
        }
    }

    public async Task<bool> SendReminderForInterviewAsync(int interviewId, CancellationToken cancellationToken = default)
    {
        var interview = await context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Candidate)
                    .ThenInclude(c => c.User)
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.DeletedAt == null, cancellationToken);

        if (interview == null) return false;

        var candidateEmail = interview.Application?.Candidate?.User?.Email;
        if (string.IsNullOrWhiteSpace(candidateEmail)) return false;

        var candidateName = interview.Application?.Candidate?.User?.FullName ?? "Ứng viên";
        var jobTitle = interview.Application?.Job?.Title ?? "Vị trí";
        var companyName = interview.Application?.Job?.Company?.Name ?? "Doanh nghiệp";

        var subject = $"[Nhắc Hẹn Phỏng Vấn] Buổi phỏng vấn vị trí {jobTitle} tại {companyName}";
        var body = $"<p>Xin chào {candidateName}, buổi phỏng vấn của bạn sẽ bắt đầu lúc {interview.StartTime:dd/MM/yyyy HH:mm}. Vui lòng có mặt đúng giờ.</p>";

        return await emailService.SendEmailAsync(candidateEmail, subject, body, cancellationToken);
    }
}
