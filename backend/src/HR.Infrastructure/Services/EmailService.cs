using System;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration, IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _serviceScopeFactory = serviceScopeFactory;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("[EMAIL] Attempted to send email but recipient address is empty.");
            return false;
        }

        string? smtpHost = null;
        string? smtpPortStr = null;
        string? smtpUser = null;
        string? smtpPass = null;
        string? fromEmail = null;
        string? fromName = null;
        bool enableSsl = true;

        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetService<IApplicationDbContext>();
            if (db != null)
            {
                var configs = await db.SettingConfigs
                    .Where(s => s.ConfigKey.StartsWith("smtp."))
                    .ToDictionaryAsync(s => s.ConfigKey, s => s.ConfigValue, cancellationToken);

                configs.TryGetValue("smtp.host", out smtpHost);
                configs.TryGetValue("smtp.port", out smtpPortStr);
                configs.TryGetValue("smtp.username", out smtpUser);
                configs.TryGetValue("smtp.password", out smtpPass);
                configs.TryGetValue("smtp.from_email", out fromEmail);
                configs.TryGetValue("smtp.from_name", out fromName);
                if (configs.TryGetValue("smtp.enable_ssl", out var sslStr))
                {
                    bool.TryParse(sslStr, out enableSsl);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[EMAIL] Could not read SMTP settings from DB, falling back to configuration.");
        }

        // Fallback to IConfiguration if not set in DB
        smtpHost = !string.IsNullOrWhiteSpace(smtpHost) ? smtpHost : _configuration["Smtp:Host"];
        smtpPortStr = !string.IsNullOrWhiteSpace(smtpPortStr) ? smtpPortStr : _configuration["Smtp:Port"];
        smtpUser = !string.IsNullOrWhiteSpace(smtpUser) ? smtpUser : _configuration["Smtp:Username"];
        smtpPass = !string.IsNullOrWhiteSpace(smtpPass) ? smtpPass : _configuration["Smtp:Password"];
        fromEmail = !string.IsNullOrWhiteSpace(fromEmail) ? fromEmail : (_configuration["Smtp:FromEmail"] ?? (!string.IsNullOrWhiteSpace(smtpUser) ? smtpUser : "no-reply@hrportal.com"));
        fromName = !string.IsNullOrWhiteSpace(fromName) ? fromName : (_configuration["Smtp:FromName"] ?? "Hệ thống Tuyển dụng HR Portal");
        if (_configuration["Smtp:EnableSsl"] != null)
        {
            enableSsl = _configuration.GetValue<bool>("Smtp:EnableSsl", true);
        }

        // If SMTP credentials configured, attempt real send
        if (!string.IsNullOrWhiteSpace(smtpHost) && int.TryParse(smtpPortStr, out var smtpPort) && !string.IsNullOrWhiteSpace(smtpUser) && !string.IsNullOrWhiteSpace(smtpPass))
        {
            try
            {
                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = enableSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(smtpUser.Trim(), smtpPass.Trim())
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail.Trim(), fromName.Trim()),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail.Trim());

                await client.SendMailAsync(mailMessage, cancellationToken);
                _logger.LogInformation("[EMAIL] Successfully sent email to {ToEmail} with subject: '{Subject}' via SMTP {Host}:{Port}", toEmail, subject, smtpHost, smtpPort);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[EMAIL] Failed to send email to {ToEmail} via SMTP ({Host}:{Port}, User: {User}). Error: {Error}. Fallback to mock log.", toEmail, smtpHost, smtpPort, smtpUser, ex.Message);
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
                    <h2 style=""color: #2563eb; margin: 0;"">Thông Báo Kết Quả Hồ Sơ</h2>
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

    public async Task<bool> SendInterviewInvitationAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime startTime,
        DateTime endTime,
        string interviewType,
        string? locationOrLink,
        string? notes,
        CancellationToken cancellationToken = default)
    {
        var subject = $"[HR Portal] Lời mời phỏng vấn vị trí {jobTitle} từ {companyName}";
        var timeStr = $"{startTime:dd/MM/yyyy HH:mm} - {endTime:HH:mm}";
        var typeBadge = interviewType.Equals("ONLINE", StringComparison.OrdinalIgnoreCase) ? "Trực tuyến (Online)" : "Trực tiếp (Tại văn phòng)";

        var body = $@"
            <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: #0284c7; margin: 0;"">Lời Mời Phỏng Vấn</h2>
                    <p style=""color: #6b7280; font-size: 14px;"">{companyName} trân trọng mời bạn tham gia buổi phỏng vấn</p>
                </div>
                <p>Xin chào <strong>{candidateName}</strong>,</p>
                <p>Nhà tuyển dụng <strong>{companyName}</strong> rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia buổi phỏng vấn cho vị trí: <span style=""color: #0284c7; font-weight: bold;"">{jobTitle}</span>.</p>
                
                <div style=""background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 16px; margin: 18px 0;"">
                    <h4 style=""margin: 0 0 10px 0; color: #0369a1;"">Chi tiết buổi phỏng vấn:</h4>
                    <p style=""margin: 6px 0;""><strong>Thời gian:</strong> {timeStr}</p>
                    <p style=""margin: 6px 0;""><strong>Hình thức:</strong> {typeBadge}</p>
                    <p style=""margin: 6px 0;""><strong>Địa điểm / Đường dẫn:</strong> <a href=""{locationOrLink}"" style=""color: #0284c7;"">{locationOrLink ?? "Sẽ cập nhật thêm"}</a></p>
                    {(string.IsNullOrWhiteSpace(notes) ? "" : $"<p style=\"margin: 6px 0;\"><strong>Ghi chú:</strong> {notes}</p>")}
                </div>

                <p>Vui lòng đăng nhập vào tài khoản HR Portal để <strong>Xác nhận</strong> hoặc <strong>Phản hồi</strong> lời mời này sớm nhất có thể.</p>

                <p style=""text-align: center; margin: 28px 0;"">
                    <a href=""http://localhost:5175/interviews"" style=""background-color: #0284c7; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">
                        Xem & Phản Hồi Lịch Phỏng Vấn
                    </a>
                </p>
                <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"" />
                <p style=""font-size: 12px; color: #9ca3af; text-align: center;"">
                    Đây là email tự động từ hệ thống HR Portal.
                </p>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task<bool> SendApplicationStatusEmailAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string companyName,
        string status,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var subject = $"[HR Portal] Cập nhật trạng thái ứng tuyển: {jobTitle} tại {companyName}";
        string statusText;
        string statusColor;
        string statusBg;
        string description;

        switch (status.ToUpperInvariant())
        {
            case "SHORTLISTED":
                statusText = "Phù hợp hồ sơ (Shortlisted)";
                statusColor = "#16a34a";
                statusBg = "#f0fdf4";
                description = "Hồ sơ của bạn đã vượt qua vòng lọc CV và được chọn vào danh sách phỏng vấn tiềm năng.";
                break;
            case "INTERVIEW":
                statusText = "Mời phỏng vấn (Interview)";
                statusColor = "#0284c7";
                statusBg = "#f0f9ff";
                description = "Bạn đã được chọn vào vòng phỏng vấn. Vui lòng kiểm tra lịch phỏng vấn trên hệ thống.";
                break;
            case "OFFER":
                statusText = "Đề xuất nhận việc (Job Offer)";
                statusColor = "#7c3aed";
                statusBg = "#f5f3ff";
                description = "Nhà tuyển dụng đã gửi đề xuất nhận việc (Offer) dành cho bạn.";
                break;
            case "HIRED":
                statusText = "Đã tuyển dụng (Hired)";
                statusColor = "#059669";
                statusBg = "#ecfdf5";
                description = "Chúc mừng bạn đã chính thức gia nhập đội ngũ!";
                break;
            case "REJECTED":
                statusText = "Chưa phù hợp (Rejected)";
                statusColor = "#dc2626";
                statusBg = "#fef2f2";
                description = "Cảm ơn bạn đã quan tâm. Rất tiếc hồ sơ chưa phù hợp với vị trí này vào thời điểm hiện tại. Thông tin của bạn sẽ được lưu trữ cho các cơ hội tương lai.";
                break;
            default:
                statusText = status;
                statusColor = "#4b5563";
                statusBg = "#f3f4f6";
                description = $"Trạng thái đơn ứng tuyển của bạn đã được cập nhật thành: {status}.";
                break;
        }

        var body = $@"
            <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: {statusColor}; margin: 0;"">Cập Nhật Trạng Thái Đơn Ứng Tuyển</h2>
                    <p style=""color: #6b7280; font-size: 14px;"">{companyName} • {jobTitle}</p>
                </div>
                <p>Xin chào <strong>{candidateName}</strong>,</p>
                <p>Đơn ứng tuyển của bạn cho vị trí <strong>{jobTitle}</strong> tại <strong>{companyName}</strong> vừa được cập nhật trạng thái mới:</p>
                
                <div style=""background-color: {statusBg}; border-left: 4px solid {statusColor}; padding: 14px 18px; margin: 18px 0; border-radius: 4px;"">
                    <h4 style=""margin: 0; color: {statusColor};"">Trạng thái mới: {statusText}</h4>
                    <p style=""margin: 6px 0 0 0; color: #374151; font-size: 14px;"">{description}</p>
                    {(string.IsNullOrWhiteSpace(notes) ? "" : $"<p style=\"margin: 8px 0 0 0; font-size: 13px; color: #6b7280;\"><strong>Lời nhắn:</strong> {notes}</p>")}
                </div>

                <p style=""text-align: center; margin: 28px 0;"">
                    <a href=""http://localhost:5175/candidate/applications"" style=""background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">
                        Kiểm Tra Lịch Sử Ứng Tuyển
                    </a>
                </p>
                <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"" />
                <p style=""font-size: 12px; color: #9ca3af; text-align: center;"">
                    Đây là email tự động từ hệ thống HR Portal.
                </p>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task<bool> SendOfferLetterEmailAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string companyName,
        string? salary,
        DateTime? startDate,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var subject = $"[HR Portal] Thư mời nhận việc (Offer Letter) từ {companyName} cho vị trí {jobTitle}";
        var salaryStr = !string.IsNullOrWhiteSpace(salary) ? salary : "Thoả thuận theo quy chế công ty";
        var startDateStr = startDate.HasValue ? startDate.Value.ToString("dd/MM/yyyy") : "Theo thỏa thuận hai bên";

        var body = $@"
            <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: #7c3aed; margin: 0;"">Thư Mời Nhận Việc (Job Offer)</h2>
                    <p style=""color: #6b7280; font-size: 14px;"">Chúc mừng bạn đã vượt qua các vòng tuyển dụng</p>
                </div>
                <p>Kính gửi <strong>{candidateName}</strong>,</p>
                <p>Công ty <strong>{companyName}</strong> rất vui mừng được gửi tới bạn lời mời gia nhập đội ngũ tại vị trí: <span style=""color: #7c3aed; font-weight: bold;"">{jobTitle}</span>.</p>
                
                <div style=""background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 16px; margin: 18px 0;"">
                    <h4 style=""margin: 0 0 10px 0; color: #6b21a8;"">Tóm tắt các điều khoản:</h4>
                    <p style=""margin: 6px 0;""><strong>Vị trí:</strong> {jobTitle}</p>
                    <p style=""margin: 6px 0;""><strong>Mức lương đề xuất:</strong> <strong style=""color: #059669;"">{salaryStr}</strong></p>
                    <p style=""margin: 6px 0;""><strong>Dự kiến bắt đầu làm việc:</strong> {startDateStr}</p>
                    {(string.IsNullOrWhiteSpace(notes) ? "" : $"<p style=\"margin: 6px 0;\"><strong>Ghi chú:</strong> {notes}</p>")}
                </div>

                <p>Bạn có thể trao đổi trực tiếp hoặc phản hồi đề xuất này với người đại diện tuyển dụng qua hệ thống tin nhắn HR Portal.</p>

                <p style=""text-align: center; margin: 28px 0;"">
                    <a href=""http://localhost:5175/candidate/applications"" style=""background-color: #7c3aed; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">
                        Xem Chi Tiết Đề Xuất & Ứng Tuyển
                    </a>
                </p>
                <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"" />
                <p style=""font-size: 12px; color: #9ca3af; text-align: center;"">
                    Chúc bạn có một hành trình sự nghiệp thành công cùng {companyName}!
                </p>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task<bool> SendAssessmentInvitationAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string companyName,
        string testTitle,
        string testType,
        int durationMinutes,
        int passingScore,
        int testId,
        CancellationToken cancellationToken = default)
    {
        var subject = $"[HR Portal] Thư mời làm bài kiểm tra năng lực ({testTitle}) - {companyName}";
        var testLink = $"http://localhost:5175/candidate/assessment/{testId}";

        var body = $@"
            <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: #2563eb; margin: 0;"">Bài Kiểm Tra Năng Lực Trực Tuyến</h2>
                    <p style=""color: #6b7280; font-size: 14px;"">Vòng đánh giá năng lực chuyên môn và kỹ năng</p>
                </div>
                <p>Kính gửi <strong>{candidateName}</strong>,</p>
                <p>Cảm ơn bạn đã ứng tuyển vị trí <strong>{jobTitle}</strong> tại <strong>{companyName}</strong>.</p>
                <p>Hồ sơ của bạn đã vượt qua vòng sơ loại. Để đánh giá mức độ phù hợp với vị trí công việc, nhà tuyển dụng trân trọng mời bạn tham gia bài kiểm tra năng lực trực tuyến:</p>
                
                <div style=""background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 18px 0;"">
                    <h4 style=""margin: 0 0 10px 0; color: #1e40af;"">Thông tin bài kiểm tra:</h4>
                    <p style=""margin: 6px 0;""><strong>Tên bài test:</strong> {testTitle}</p>
                    <p style=""margin: 6px 0;""><strong>Loại bài thi:</strong> {testType}</p>
                    <p style=""margin: 6px 0;""><strong>Thời gian làm bài:</strong> <strong style=""color: #dc2626;"">{durationMinutes} phút</strong></p>
                    <p style=""margin: 6px 0;""><strong>Điểm đạt chuẩn:</strong> <strong style=""color: #059669;"">&ge; {passingScore}%</strong></p>
                    <p style=""margin: 6px 0; font-size: 13px; color: #4b5563;""><em>Lưu ý: Hệ thống sẽ tự động chấm điểm ngay khi nộp bài. Nếu đạt điểm chuẩn, bạn sẽ được tự động chuyển sang vòng Shortlisted và mở lịch phỏng vấn.</em></p>
                </div>

                <p style=""text-align: center; margin: 28px 0;"">
                    <a href=""{testLink}"" style=""background-color: #2563eb; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;"">
                        Bắt Đầu Làm Bài Test Ngay
                    </a>
                </p>
                <p style=""font-size: 13px; color: #6b7280;"">Đường dẫn làm bài trực tiếp: <a href=""{testLink}"" style=""color: #2563eb;"">{testLink}</a></p>
                <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"" />
                <p style=""font-size: 12px; color: #9ca3af; text-align: center;"">
                    Chúc bạn hoàn thành bài test thật tốt cùng {companyName}!
                </p>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task<bool> SendAssessmentResultEmailAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string companyName,
        string testTitle,
        int score,
        int passingScore,
        bool isPassed,
        CancellationToken cancellationToken = default)
    {
        var statusBadge = isPassed
            ? @"<span style=""background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 9999px; font-weight: bold;"">ĐẠT CHUẨN (PASSED)</span>"
            : @"<span style=""background-color: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 9999px; font-weight: bold;"">ĐANG XEM XÉT THÊM</span>";

        var subject = $"[HR Portal] Kết quả bài kiểm tra ({score}%) vị trí {jobTitle} - {companyName}";

        var body = $@"
            <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: {(isPassed ? "#059669" : "#d97706")}; margin: 0;"">Kết Quả Bài Kiểm Tra Năng Lực</h2>
                    <p style=""color: #6b7280; font-size: 14px;"">{testTitle}</p>
                </div>
                <p>Kính gửi <strong>{candidateName}</strong>,</p>
                <p>Hệ thống HR Portal đã hoàn tất chấm điểm bài kiểm tra của bạn cho vị trí <strong>{jobTitle}</strong> tại <strong>{companyName}</strong>.</p>
                
                <div style=""background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 18px 0; text-align: center;"">
                    <p style=""font-size: 14px; color: #6b7280; margin: 0 0 6px 0;"">Điểm số đạt được:</p>
                    <div style=""font-size: 38px; font-weight: 800; color: {(isPassed ? "#059669" : "#dc2626")}; margin-bottom: 8px;"">{score}%</div>
                    <p style=""margin: 0 0 12px 0; font-size: 14px;"">Điểm đạt chuẩn yêu cầu: <strong>{passingScore}%</strong></p>
                    <div>{statusBadge}</div>
                </div>

                {(isPassed ? @"
                <div style=""background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0;"">
                    <p style=""margin: 0; color: #065f46; font-size: 14px;"">
                        <strong>Chúc mừng!</strong> Hồ sơ của bạn đã được chuyển sang vòng <strong>SHORTLISTED</strong>. Nhà tuyển dụng sẽ sớm liên hệ để thống nhất lịch phỏng vấn tiếp theo.
                    </p>
                </div>
                " : @"
                <div style=""background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0;"">
                    <p style=""margin: 0; color: #92400e; font-size: 14px;"">
                        Kết quả bài thi đã được lưu vào hồ sơ ứng tuyển. Nhà tuyển dụng sẽ xem xét đánh giá tổng quan kinh nghiệm và năng lực của bạn trong danh sách chờ xem xét thêm.
                    </p>
                </div>
                ")}

                <p style=""text-align: center; margin: 28px 0;"">
                    <a href=""http://localhost:5175/candidate/applications"" style=""background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">
                        Theo Dõi Tiến Trình Ứng Tuyển
                    </a>
                </p>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task<bool> SendDetailedOfferLetterEmailAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string companyName,
        int offerId,
        string positionTitle,
        decimal basicSalary,
        decimal allowance,
        string salaryType,
        string currency,
        int probationMonths,
        decimal probationPercentage,
        DateTime startDate,
        DateTime expiryDate,
        string? workLocation,
        string? benefits,
        string? offerPdfUrl,
        CancellationToken cancellationToken = default)
    {
        var subject = $"[HR Portal] THƯ MỜI NHẬN VIỆC CHÍNH THỨC - {companyName} trân trọng gửi tới {candidateName}";
        var basicSalaryStr = $"{basicSalary:N0} {currency}";
        var allowanceStr = allowance > 0 ? $"{allowance:N0} {currency}" : "Không có";
        var totalStr = $"{(basicSalary + allowance):N0} {currency}";
        var probationSalaryStr = $"{((basicSalary * probationPercentage / 100m) + allowance):N0} {currency}";
        var startDateStr = startDate.ToString("dd/MM/yyyy");
        var expiryDateStr = expiryDate.ToString("dd/MM/yyyy HH:mm");

        var body = $@"
            <div style=""font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);"">
                <div style=""background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 28px 24px; text-align: center;"">
                    <h1 style=""margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;"">THƯ MỜI NHẬN VIỆC (JOB OFFER)</h1>
                    <p style=""margin: 0; font-size: 15px; opacity: 0.9;"">{companyName} trân trọng chào đón bạn gia nhập đội ngũ</p>
                </div>

                <div style=""padding: 24px;"">
                    <p style=""font-size: 16px;"">Kính gửi <strong>{candidateName}</strong>,</p>
                    <p>Chúc mừng bạn đã hoàn thành các vòng phỏng vấn và đánh giá năng lực tại <strong>{companyName}</strong>. Chúng tôi rất ấn tượng với năng lực chuyên môn và tinh thần làm việc của bạn, và trân trọng gửi tới bạn đề xuất nhận việc với các điều khoản đãi ngộ chi tiết như sau:</p>

                    <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;"">
                        <h3 style=""margin: 0 0 12px 0; color: #4338ca; font-size: 16px; border-bottom: 2px solid #e0e7ff; padding-bottom: 6px;"">Thông Tin Vị Trí & Chế Độ Đãi Ngộ</h3>
                        
                        <table style=""width: 100%; border-collapse: collapse; font-size: 14px;"">
                            <tr>
                                <td style=""padding: 6px 0; color: #64748b; width: 45%;"">Vị trí bổ nhiệm:</td>
                                <td style=""padding: 6px 0; font-weight: 700; color: #1e293b;"">{positionTitle}</td>
                            </tr>
                            <tr>
                                <td style=""padding: 6px 0; color: #64748b;"">Lương cơ bản ({salaryType}):</td>
                                <td style=""padding: 6px 0; font-weight: 700; color: #059669;"">{basicSalaryStr}</td>
                            </tr>
                            <tr>
                                <td style=""padding: 6px 0; color: #64748b;"">Phụ cấp:</td>
                                <td style=""padding: 6px 0; font-weight: 600;"">{allowanceStr}</td>
                            </tr>
                            <tr style=""border-top: 1px dashed #cbd5e1;"">
                                <td style=""padding: 8px 0; color: #4338ca; font-weight: 700;"">Tổng thu nhập chính thức:</td>
                                <td style=""padding: 8px 0; font-weight: 800; color: #4338ca; font-size: 16px;"">{totalStr} / tháng</td>
                            </tr>
                            <tr>
                                <td style=""padding: 6px 0; color: #64748b;"">Thời gian thử việc:</td>
                                <td style=""padding: 6px 0; font-weight: 600;"">{probationMonths} tháng ({probationPercentage}% lương: ~{probationSalaryStr})</td>
                            </tr>
                            <tr>
                                <td style=""padding: 6px 0; color: #64748b;"">Ngày bắt đầu nhận việc:</td>
                                <td style=""padding: 6px 0; font-weight: 700; color: #2563eb;"">{startDateStr}</td>
                            </tr>
                            <tr>
                                <td style=""padding: 6px 0; color: #64748b;"">Hạn chót phản hồi đề xuất:</td>
                                <td style=""padding: 6px 0; font-weight: 700; color: #dc2626;"">{expiryDateStr}</td>
                            </tr>
                            {(string.IsNullOrWhiteSpace(workLocation) ? "" : $@"
                            <tr>
                                <td style=""padding: 6px 0; color: #64748b;"">Địa điểm làm việc:</td>
                                <td style=""padding: 6px 0;"">{workLocation}</td>
                            </tr>
                            ")}
                        </table>
                    </div>

                    {(string.IsNullOrWhiteSpace(benefits) ? "" : $@"
                    <div style=""background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0; font-size: 14px; border-radius: 4px;"">
                        <strong style=""color: #166534;"">Quyền lợi & Phúc lợi khác:</strong>
                        <p style=""margin: 4px 0 0 0; color: #14532d;"">{benefits}</p>
                    </div>
                    ")}

                    {(string.IsNullOrWhiteSpace(offerPdfUrl) ? "" : $@"
                    <p style=""font-size: 14px; color: #475569;"">
                        Đính kèm: <a href=""http://localhost:5175{offerPdfUrl}"" target=""_blank"" style=""color: #2563eb; font-weight: 600; text-decoration: underline;"">Tải xuống Thư mời nhận việc (File PDF chính thức)</a>
                    </p>
                    ")}

                    <p style=""margin: 24px 0 10px 0; font-size: 14px;"">Vui lòng truy cập hệ thống để <strong>Ký Duyệt Chấp Nhận</strong>, <strong>Yêu Cầu Thương Lượng</strong> hoặc <strong>Từ Chối</strong> trước thời hạn quy định:</p>

                    <div style=""text-align: center; margin: 24px 0;"">
                        <a href=""http://localhost:5175/candidate/offers/{offerId}"" style=""background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);"">
                            XEM & PHẢN HỒI THƯ MỜI NHẬN VIỆC
                        </a>
                    </div>
                </div>

                <div style=""background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"">
                    Thư được gửi tự động từ Hệ Thống Tuyển Dụng & Nhân Sự HR Portal • {companyName}
                </div>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task<bool> SendOfferResponseNotificationAsync(
        string toEmail,
        string employerName,
        string candidateName,
        string jobTitle,
        string companyName,
        string responseAction,
        decimal? desiredSalary,
        string? candidateNote,
        string? declineReason,
        CancellationToken cancellationToken = default)
    {
        string actionTitle;
        string actionColor;
        string actionBadge;

        switch (responseAction.ToUpper())
        {
            case "ACCEPT":
                actionTitle = "Ứng viên ĐÃ CHẤP NHẬN thư mời nhận việc (Offer Accepted)";
                actionColor = "#059669";
                actionBadge = @"<span style=""background-color: #d1fae5; color: #065f46; padding: 6px 16px; border-radius: 9999px; font-weight: 800; font-size: 15px;"">ĐỒNG Ý NHẬN VIỆC (HIRED)</span>";
                break;
            case "NEGOTIATE":
                actionTitle = "Ứng viên ĐỀ XUẤT THƯƠNG LƯỢNG LẠI điều khoản offer";
                actionColor = "#d97706";
                actionBadge = @"<span style=""background-color: #fef3c7; color: #92400e; padding: 6px 16px; border-radius: 9999px; font-weight: 800; font-size: 15px;"">YÊU CẦU THƯƠNG LƯỢNG (DISCUSS)</span>";
                break;
            default:
                actionTitle = "Ứng viên ĐÃ TỪ CHỐI thư mời nhận việc (Offer Declined)";
                actionColor = "#dc2626";
                actionBadge = @"<span style=""background-color: #fee2e2; color: #991b1b; padding: 6px 16px; border-radius: 9999px; font-weight: 800; font-size: 15px;"">TỪ CHỐI OFFER</span>";
                break;
        }

        var subject = $"[HR Portal] Phản hồi Offer: Ứng viên {candidateName} - Vị trí {jobTitle}";

        var body = $@"
            <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: {actionColor}; margin: 0 0 8px 0;"">{actionTitle}</h2>
                    <div>{actionBadge}</div>
                </div>

                <p>Kính gửi <strong>{employerName}</strong> ({companyName}),</p>
                <p>Hệ thống HR Portal ghi nhận phản hồi mới từ ứng viên <strong>{candidateName}</strong> cho vị trí <strong>{jobTitle}</strong>:</p>

                <div style=""background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 18px 0;"">
                    {(desiredSalary.HasValue ? $"<p style=\"margin: 6px 0;\"><strong>Mức lương ứng viên mong muốn:</strong> <strong style=\"color: #059669;\">{desiredSalary.Value:N0} VND</strong></p>" : "")}
                    {(!string.IsNullOrWhiteSpace(candidateNote) ? $"<p style=\"margin: 6px 0;\"><strong>Ghi chú / Đề xuất trao đổi:</strong> {candidateNote}</p>" : "")}
                    {(!string.IsNullOrWhiteSpace(declineReason) ? $"<p style=\"margin: 6px 0; color: #dc2626;\"><strong>Lý do từ chối:</strong> {declineReason}</p>" : "")}
                </div>

                {(responseAction.ToUpper() == "ACCEPT" ? @"
                <div style=""background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0;"">
                    <p style=""margin: 0; color: #065f46; font-size: 14px;"">
                        Hồ sơ ứng viên đã được hệ thống <strong>TỰ ĐỘNG CHUYỂN SANG TRẠNG THÁI HIRED</strong>. Quý công ty vui lòng chuẩn bị kế hoạch Onboarding tiếp đón nhân sự mới!
                    </p>
                </div>
                " : "")}

                <p style=""text-align: center; margin: 28px 0;"">
                    <a href=""http://localhost:5175/employer/applications"" style=""background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">
                        Xem Hồ Sơ Tuyển Dụng Trên HR Portal
                    </a>
                </p>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task<bool> SendJobInvitationEmailAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string companyName,
        string employerName,
        string? message,
        string jobUrl,
        CancellationToken cancellationToken = default)
    {
        var subject = $"[HR Portal] Lời mời ứng tuyển vị trí {jobTitle} từ {companyName}";

        var body = $@"
            <div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: #4f46e5; margin: 0 0 8px 0;"">Lời Mời Ứng Tuyển Cơ Hội Nghề Nghiệp</h2>
                    <span style=""display: inline-block; padding: 4px 12px; background-color: #e0e7ff; color: #4338ca; border-radius: 12px; font-weight: bold; font-size: 13px;"">
                        LỜI MỜI TRỰC TIẾP TỪ DOANH NGHIỆP
                    </span>
                </div>

                <p>Kính gửi <strong>{candidateName}</strong>,</p>
                <p>Chúng tôi là bộ phận tuyển dụng tại <strong>{companyName}</strong>. Qua việc tìm hiểu hồ sơ năng lực công khai và kinh nghiệm của bạn trên hệ thống HR Portal, chúng tôi nhận thấy bạn là ứng viên tiềm năng cho vị trí:</p>

                <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 16px; margin: 18px 0;"">
                    <p style=""margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #1e293b;"">Vị trí: {jobTitle}</p>
                    <p style=""margin: 0; color: #475569;"">Doanh nghiệp: <strong>{companyName}</strong></p>
                    <p style=""margin: 4px 0 0 0; color: #64748b; font-size: 13px;"">Người liên hệ: {employerName}</p>
                </div>

                {(!string.IsNullOrWhiteSpace(message) ? $@"
                <div style=""background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px; margin: 16px 0;"">
                    <strong style=""color: #166534;"">Lời nhắn từ Nhà tuyển dụng:</strong>
                    <p style=""margin: 6px 0 0 0; color: #15803d; font-style: italic;"">""{message}""</p>
                </div>
                " : "")}

                <p>Chúng tôi trân trọng mời bạn tham khảo chi tiết bản mô tả công việc (JD), mức đãi ngộ và ứng tuyển để cùng kết nối trao đổi thêm:</p>

                <p style=""text-align: center; margin: 28px 0;"">
                    <a href=""{jobUrl}"" style=""background-color: #4f46e5; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;"">
                        Xem Chi Tiết Vị Trí & Ứng Tuyển Ngay
                    </a>
                </p>

                <p style=""font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px;"">
                    Bạn cũng có thể phản hồi tin nhắn trực tiếp với Nhà tuyển dụng thông qua tính năng <strong>Tin nhắn & Trò chuyện</strong> trên hệ thống HR Portal. Chúc bạn một ngày tốt lành và nhiều cơ hội phát triển!
                </p>
            </div>
        ";

        return await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }
}

