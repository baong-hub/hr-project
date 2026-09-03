using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Application.Common.Interfaces;

namespace HR.Application.Auth.Commands.Logout;

public class LogoutHandler : IRequestHandler<LogoutCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public LogoutHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokenRecord = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken);

        if (tokenRecord != null)
        {
            tokenRecord.IsRevoked = true;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
