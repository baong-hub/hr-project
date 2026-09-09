using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
    Task<bool> SendShortlistNotificationAsync(string toEmail, string candidateName, string jobTitle, string companyName, CancellationToken cancellationToken = default);
    Task<bool> SendInterviewInvitationAsync(string toEmail, string candidateName, string jobTitle, string companyName, System.DateTime startTime, System.DateTime endTime, string interviewType, string? locationOrLink, string? notes, CancellationToken cancellationToken = default);
    Task<bool> SendApplicationStatusEmailAsync(string toEmail, string candidateName, string jobTitle, string companyName, string status, string? notes = null, CancellationToken cancellationToken = default);
    Task<bool> SendOfferLetterEmailAsync(string toEmail, string candidateName, string jobTitle, string companyName, string? salary, System.DateTime? startDate, string? notes = null, CancellationToken cancellationToken = default);
    Task<bool> SendAssessmentInvitationAsync(string toEmail, string candidateName, string jobTitle, string companyName, string testTitle, string testType, int durationMinutes, int passingScore, int testId, CancellationToken cancellationToken = default);
    Task<bool> SendAssessmentResultEmailAsync(string toEmail, string candidateName, string jobTitle, string companyName, string testTitle, int score, int passingScore, bool isPassed, CancellationToken cancellationToken = default);
    Task<bool> SendDetailedOfferLetterEmailAsync(
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
        System.DateTime startDate,
        System.DateTime expiryDate,
        string? workLocation,
        string? benefits,
        string? offerPdfUrl,
        CancellationToken cancellationToken = default);
    Task<bool> SendOfferResponseNotificationAsync(
        string toEmail,
        string employerName,
        string candidateName,
        string jobTitle,
        string companyName,
        string responseAction,
        decimal? desiredSalary,
        string? candidateNote,
        string? declineReason,
        CancellationToken cancellationToken = default);
    Task<bool> SendJobInvitationEmailAsync(
        string toEmail,
        string candidateName,
        string jobTitle,
        string companyName,
        string employerName,
        string? message,
        string jobUrl,
        CancellationToken cancellationToken = default);
}
