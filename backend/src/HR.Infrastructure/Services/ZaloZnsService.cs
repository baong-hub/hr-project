using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

public class ZaloZnsService : IZaloZnsService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ZaloZnsService> _logger;
    private readonly HttpClient _httpClient;
    private static DateTime? _lastSentAt;

    public ZaloZnsService(IConfiguration configuration, ILogger<ZaloZnsService> logger, HttpClient? httpClient = null)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient ?? new HttpClient();
    }

    public async Task<ZnsSendResult> SendInterviewInvitationZnsAsync(
        string phoneNumber,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime interviewDate,
        string interviewLocationOrLink,
        CancellationToken cancellationToken = default)
    {
        var templateId = _configuration["ZaloZns:Templates:InterviewInvite"] ?? "ZNS_INTERVIEW_INVITE_V1";
        var templateData = new Dictionary<string, string>
        {
            ["candidate_name"] = candidateName,
            ["company_name"] = companyName,
            ["job_title"] = jobTitle,
            ["interview_time"] = interviewDate.ToString("HH:mm - dd/MM/yyyy"),
            ["location_link"] = string.IsNullOrWhiteSpace(interviewLocationOrLink) ? "Xem trong chi tiết lịch hẹn" : interviewLocationOrLink
        };

        return await SendZnsInternalAsync(phoneNumber, templateId, templateData, cancellationToken);
    }

    public async Task<ZnsSendResult> SendOfferIssuedZnsAsync(
        string phoneNumber,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime expiryDate,
        decimal salary,
        CancellationToken cancellationToken = default)
    {
        var templateId = _configuration["ZaloZns:Templates:OfferIssued"] ?? "ZNS_OFFER_ISSUED_V1";
        var templateData = new Dictionary<string, string>
        {
            ["candidate_name"] = candidateName,
            ["company_name"] = companyName,
            ["job_title"] = jobTitle,
            ["expiry_date"] = expiryDate.ToString("dd/MM/yyyy"),
            ["salary_text"] = salary > 0 ? $"{salary:N0} VND/tháng" : "Thỏa thuận"
        };

        return await SendZnsInternalAsync(phoneNumber, templateId, templateData, cancellationToken);
    }

    public async Task<ZnsSendResult> SendTestZnsAsync(
        string phoneNumber,
        string templateId,
        Dictionary<string, string> templateData,
        CancellationToken cancellationToken = default)
    {
        return await SendZnsInternalAsync(phoneNumber, templateId, templateData, cancellationToken);
    }

    public ZaloZnsStatusDto GetServiceStatus()
    {
        var isEnabled = _configuration.GetValue<bool>("ZaloZns:Enabled", true);
        var isSimulation = _configuration.GetValue<bool>("ZaloZns:IsSimulationMode", true);
        var oaId = _configuration["ZaloZns:OaId"] ?? "184920481029148";
        var appId = _configuration["ZaloZns:AppId"] ?? "hr-portal-zalo-app";

        return new ZaloZnsStatusDto
        {
            IsEnabled = isEnabled,
            IsSimulationMode = isSimulation,
            OaId = oaId,
            AppId = appId,
            ActiveTemplatesCount = 3,
            LastSentAt = _lastSentAt,
            AvailableTemplates = new List<ZnsTemplateInfo>
            {
                new()
                {
                    TemplateId = "ZNS_INTERVIEW_INVITE_V1",
                    TemplateName = "Mời phỏng vấn & Nhắc lịch hẹn",
                    Description = "Gửi thông báo lịch phỏng vấn đến ứng viên kèm giờ hẹn, tên vị trí và link họp.",
                    RequiredParams = new() { "candidate_name", "company_name", "job_title", "interview_time", "location_link" }
                },
                new()
                {
                    TemplateId = "ZNS_OFFER_ISSUED_V1",
                    TemplateName = "Thư mời nhận việc (Job Offer)",
                    Description = "Thông báo gửi Offer letter chính thức, mức lương và thời hạn phản hồi.",
                    RequiredParams = new() { "candidate_name", "company_name", "job_title", "expiry_date", "salary_text" }
                },
                new()
                {
                    TemplateId = "ZNS_APPLICATION_STATUS_V1",
                    TemplateName = "Cập nhật tiến độ ứng tuyển",
                    Description = "Thông báo kết quả duyệt hồ sơ hoặc chuyển vòng đánh giá tuyển dụng.",
                    RequiredParams = new() { "candidate_name", "job_title", "status_text" }
                }
            }
        };
    }

    private async Task<ZnsSendResult> SendZnsInternalAsync(
        string phoneNumber,
        string templateId,
        Dictionary<string, string> templateData,
        CancellationToken cancellationToken)
    {
        var isEnabled = _configuration.GetValue<bool>("ZaloZns:Enabled", true);
        if (!isEnabled)
        {
            return new ZnsSendResult
            {
                Success = false,
                ErrorCode = -1,
                ErrorMessage = "Dịch vụ Zalo ZNS đang bị vô hiệu hóa.",
                RecipientPhone = phoneNumber,
                TemplateId = templateId,
                Mode = "DISABLED"
            };
        }

        var normalizedPhone = NormalizePhoneNumber(phoneNumber);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
        {
            return new ZnsSendResult
            {
                Success = false,
                ErrorCode = 400,
                ErrorMessage = "Số điện thoại không hợp lệ.",
                RecipientPhone = phoneNumber,
                TemplateId = templateId,
                Mode = "ERROR"
            };
        }

        var isSimulation = _configuration.GetValue<bool>("ZaloZns:IsSimulationMode", true);
        var accessToken = _configuration["ZaloZns:AccessToken"];

        // If in simulation mode or no valid live access token is provided, simulate send
        if (isSimulation || string.IsNullOrWhiteSpace(accessToken) || accessToken.Contains("sandbox"))
        {
            var simMessageId = $"ZNS_SIM_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString("N")[..8]}";
            _lastSentAt = DateTime.Now;

            _logger.LogInformation(
                "[ZALO_ZNS_SIMULATION] Message sent successfully to {Phone} via template {TemplateId}. MsgId: {MsgId}. Data: {@Data}",
                normalizedPhone, templateId, simMessageId, templateData);

            return new ZnsSendResult
            {
                Success = true,
                MessageId = simMessageId,
                ErrorCode = 0,
                ErrorMessage = null,
                Mode = "SIMULATION",
                RecipientPhone = normalizedPhone,
                TemplateId = templateId,
                SentAt = DateTime.Now
            };
        }

        // Live Mode: invoke Zalo Cloud OpenAPI
        try
        {
            var requestPayload = new
            {
                phone = normalizedPhone,
                template_id = templateId,
                template_data = templateData,
                tracking_id = Guid.NewGuid().ToString("N")
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestPayload), Encoding.UTF8, "application/json");
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("access_token", accessToken);

            var response = await _httpClient.PostAsync("https://business.openapi.zalo.me/message/template", jsonContent, cancellationToken);
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;
            var error = root.TryGetProperty("error", out var errProp) ? errProp.GetInt32() : -1;
            var message = root.TryGetProperty("message", out var msgProp) ? msgProp.GetString() : string.Empty;

            var success = error == 0;
            string? msgId = null;
            if (root.TryGetProperty("data", out var dataProp) && dataProp.TryGetProperty("msg_id", out var idProp))
            {
                msgId = idProp.GetString();
            }

            if (success)
            {
                _lastSentAt = DateTime.Now;
            }

            return new ZnsSendResult
            {
                Success = success,
                MessageId = msgId ?? (success ? Guid.NewGuid().ToString("N") : null),
                ErrorCode = error,
                ErrorMessage = success ? null : message,
                Mode = "LIVE",
                RecipientPhone = normalizedPhone,
                TemplateId = templateId,
                SentAt = DateTime.Now
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ZALO_ZNS_ERROR] Error dispatching ZNS message to {Phone}", normalizedPhone);
            return new ZnsSendResult
            {
                Success = false,
                ErrorCode = 500,
                ErrorMessage = ex.Message,
                Mode = "LIVE",
                RecipientPhone = normalizedPhone,
                TemplateId = templateId,
                SentAt = DateTime.Now
            };
        }
    }

    private static string NormalizePhoneNumber(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
        var clean = phone.Trim().Replace(" ", "").Replace(".", "").Replace("-", "");
        if (clean.StartsWith("+84")) return "84" + clean[3..];
        if (clean.StartsWith("84")) return clean;
        if (clean.StartsWith("0")) return "84" + clean[1..];
        return clean;
    }
}
