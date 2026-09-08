using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("[EMAIL] Attempted to send email but recipient address is empty.");
            return false;
        }

        var smtpHost = _configuration["Smtp:Host"];
        var smtpPortStr = _configuration["Smtp:Port"];
        var smtpUser = _configuration["Smtp:Username"];
        var smtpPass = _configuration["Smtp:Password"];
        var fromEmail = _configuration["Smtp:FromEmail"] ?? "no-reply@hrportal.com";
        var fromName = _configuration["Smtp:FromName"] ?? "Hệ thống Tuyển dụng HR Portal";

        // If SMTP credentials configured, attempt real send
        if (!string.IsNullOrWhiteSpace(smtpHost) && int.TryParse(smtpPortStr, out var smtpPort))
        {
            try
            {
                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = _configuration.GetValue<bool>("Smtp:EnableSsl", true),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(smtpUser, smtpPass)
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage, cancellationToken);
                _logger.LogInformation("[EMAIL] Successfully sent email to {ToEmail} with subject: '{Subject}'", toEmail, subject);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[EMAIL] Failed to send email to {ToEmail} via SMTP. Fallback to mock log.", toEmail);
            }
        }

        // Mock / Development log
        _logger.LogInformation("\n================== [OUTGOING EMAIL NOTIFICATION] ==================\n" +
                               "To: {ToEmail}\n" +
                               "Subject: {Subject}\n" +
                               "Time: {Time}\n" +
                               "--------------------------------------------------------------------\n" +
                               "{Body}\n" +
                               "====================================================================",
                               toEmail, subject, DateTime.Now, htmlBody);
        return true;
    }

    public async Task<bool> SendShortlistNotificationAsync(string toEmail, string candidateName, string jobTitle, string companyName, CancellationToken cancellationToken = default)
    {
        var subject = $"[HR Portal] Hồ sơ của bạn đã được {companyName} đánh giá phù hợp cho vị trí {jobTitle}";
        var body = $@"
            <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: #2563eb; margin: 0;"">🎉 Chúc mừng bạn!</h2>
                    <p style=""color: #6b7280; font-size: 14px;"">Hồ sơ ứng tuyển của bạn đã được đánh giá phù hợp</p>
                </div>
                <p>Xin chào <strong>{candidateName}</strong>,</p>
                <p>Nhà tuyển dụng <strong>{companyName}</strong> vừa xem xét hồ sơ ứng tuyển của bạn cho vị trí: <span style=""color: #1d4ed8; font-weight: bold;"">{jobTitle}</span>.</p>
                <div style=""background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0; border-radius: 4px;"">
                    <p style=""margin: 0; color: #166534; font-weight: 500;"">
                        Hồ sơ của bạn đã được chuyển sang giai đoạn <strong>Phù hợp (Shortlist)</strong>.
                    </p>
                </div>
                <p>Nhà tuyển dụng đã mở kênh <strong>Trò chuyện trực tiếp (Chat)</strong> trên hệ thống để trao đổi thêm với bạn về các bước tiếp theo.</p>
                <p style=""text-align: center; margin: 28px 0;"">
                    <a href=""http://localhost:5175/messages"" style=""background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">
                        Mở tin nhắn trên HR Portal
                    </a>
                </p>
                <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"" />
                <p style=""font-size: 12px; color: #9ca3af; text-align: center;"">
                    Đây là email tự động từ hệ thống HR Portal. Vui lòng không trả lời trực tiếp email này.
                </p>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }
}
