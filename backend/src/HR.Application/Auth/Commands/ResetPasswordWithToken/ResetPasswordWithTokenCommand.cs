using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Auth.Commands.ResetPasswordWithToken;

public record ResetPasswordWithTokenCommand(string Email, string Token, string NewPassword) : IRequest<bool>;

public class ResetPasswordWithTokenCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher) : IRequestHandler<ResetPasswordWithTokenCommand, bool>
{
    public async Task<bool> Handle(ResetPasswordWithTokenCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token))
        {
            throw new BadRequestException("INVALID_REQUEST", "Thông tin yêu cầu đặt lại mật khẩu không hợp lệ.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            throw new BadRequestException("INVALID_PASSWORD", "Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.");
        }

        var normalizedEmail = request.Email.Trim().ToLower();
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.DeletedAt == null, cancellationToken);

        if (user == null || user.PasswordResetToken != request.Token)
        {
            throw new BadRequestException("INVALID_TOKEN", "Mã khôi phục mật khẩu không hợp lệ hoặc đã qua sử dụng.");
        }

        if (user.PasswordResetTokenExpiresAt.HasValue && user.PasswordResetTokenExpiresAt.Value < DateTime.UtcNow)
        {
            throw new BadRequestException("TOKEN_EXPIRED", "Mã khôi phục mật khẩu đã hết hạn. Vui lòng gửi lại yêu cầu mới.");
        }

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
