using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
    Task<bool> SendShortlistNotificationAsync(string toEmail, string candidateName, string jobTitle, string companyName, CancellationToken cancellationToken = default);
}
