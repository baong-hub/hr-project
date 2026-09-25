using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public class ZnsSendResult
{
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public int ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string Mode { get; set; } = "SIMULATION"; // "SIMULATION" | "LIVE"
    public string RecipientPhone { get; set; } = string.Empty;
    public string TemplateId { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.Now;
}

public class ZaloZnsStatusDto
{
    public bool IsEnabled { get; set; } = true;
    public bool IsSimulationMode { get; set; } = true;
    public string OaId { get; set; } = string.Empty;
    public string AppId { get; set; } = string.Empty;
    public int ActiveTemplatesCount { get; set; } = 3;
    public DateTime? LastSentAt { get; set; }
    public List<ZnsTemplateInfo> AvailableTemplates { get; set; } = new();
}

public class ZnsTemplateInfo
{
    public string TemplateId { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> RequiredParams { get; set; } = new();
}

public interface IZaloZnsService
{
    Task<ZnsSendResult> SendInterviewInvitationZnsAsync(
        string phoneNumber,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime interviewDate,
        string interviewLocationOrLink,
        CancellationToken cancellationToken = default);

    Task<ZnsSendResult> SendOfferIssuedZnsAsync(
        string phoneNumber,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime expiryDate,
        decimal salary,
        CancellationToken cancellationToken = default);

    Task<ZnsSendResult> SendTestZnsAsync(
        string phoneNumber,
        string templateId,
        Dictionary<string, string> templateData,
        CancellationToken cancellationToken = default);

    ZaloZnsStatusDto GetServiceStatus();
}
