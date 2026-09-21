using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Auth.Commands.ResendVerificationEmail;

public record ResendVerificationEmailCommand(string Email) : IRequest<bool>;

public class ResendVerificationEmailCommandHandler(
    IApplicationDbContext context,
    IEmailService emailService) : IRequestHandler<ResendVerificationEmailCommand, bool>
{
    public async Task<bool> Handle(ResendVerificationEmailCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new BadRequestException("INVALID_EMAIL", "Địa chỉ email không được để trống.");
        }

        var normalizedEmail = request.Email.Trim().ToLower();
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.DeletedAt == null, cancellationToken);

        if (user == null)
        {
            // Bảo mật: không tiết lộ email tồn tại hay không
            return true;
        }

        if (user.IsEmailVerified)
        {
            return true;
        }

        var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        user.EmailVerificationToken = token;
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await context.SaveChangesAsync(cancellationToken);

        var verifyUrl = $"http://localhost:5173/auth/verify-email?token={token}";
        var body = $@"
            <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;"">
                <h2 style=""color: #2563eb;"">Xác Thực Địa Chỉ Email - HR Portal</h2>
                <p>Xin chào <strong>{user.FullName ?? user.Username}</strong>,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản trên nền tảng tuyển dụng HR Portal. Vui lòng bấm vào nút bên dưới để kích hoạt và xác thực địa chỉ email của bạn:</p>
                <div style=""text-align: center; margin: 30px 0;"">
                    <a href=""{verifyUrl}"" style=""background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">Xác Thực Email Ngay</a>
                </div>
                <p style=""color: #64748b; font-size: 13px;"">Liên kết này có hiệu lực trong vòng 24 giờ. Nếu bạn không thực hiện đăng ký tài khoản này, vui lòng bỏ qua email.</p>
            </div>";

        await emailService.SendEmailAsync(user.Email, "[HR Portal] Xác thực tài khoản của bạn", body, cancellationToken);
        return true;
    }
}
