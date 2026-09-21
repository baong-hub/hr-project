using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Auth.Commands.VerifyEmail;

public record VerifyEmailCommand(string Token) : IRequest<bool>;

public class VerifyEmailCommandHandler(IApplicationDbContext context) : IRequestHandler<VerifyEmailCommand, bool>
{
    public async Task<bool> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            throw new BadRequestException("INVALID_TOKEN", "Mã xác thực email không hợp lệ.");
        }

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == request.Token && u.DeletedAt == null, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", "Mã xác thực email không tồn tại hoặc đã hết hiệu lực.");
        }

        if (user.EmailVerificationTokenExpiresAt.HasValue && user.EmailVerificationTokenExpiresAt.Value < DateTime.UtcNow)
        {
            throw new BadRequestException("TOKEN_EXPIRED", "Mã xác thực email đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.");
        }

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiresAt = null;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
