using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public interface ISessionValidationService
{
    Task<bool> IsSessionRevokedAsync(string sessionId, CancellationToken cancellationToken = default);
    void InvalidateSessionCache(string sessionId);
}

