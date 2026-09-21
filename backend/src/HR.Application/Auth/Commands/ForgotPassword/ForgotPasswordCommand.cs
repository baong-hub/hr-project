using System;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Auth.Commands.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<bool>;

public class ForgotPasswordCommandHandler(
    IApplicationDbContext context,
    IEmailService emailService) : IRequestHandler<ForgotPasswordCommand, bool>
{
    public async Task<bool> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
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
            // Bảo mật: không tiết lộ email có tồn tại trên hệ thống hay không để tránh user enumeration
            return true;
        }

        // Sinh token bảo mật ngẫu nhiên
        var resetToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1); // Hiệu lực 1 giờ

        await context.SaveChangesAsync(cancellationToken);

        var resetUrl = $"http://localhost:5173/auth/reset-password?token={resetToken}&email={Uri.EscapeDataString(user.Email)}";
        var htmlBody = $@"
            <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;"">
                <div style=""border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;"">
                    <h2 style=""color: #1e293b; margin: 0;"">Khôi Phục Mật Khẩu - HR Portal</h2>
                </div>
                <p>Xin chào <strong>{user.FullName ?? user.Username}</strong>,</p>
                <p>Hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này.</p>
                <p>Vui lòng nhấn vào nút bên dưới để tiến hành thiết lập mật khẩu mới:</p>
                <div style=""text-align: center; margin: 30px 0;"">
                    <a href=""{resetUrl}"" style=""background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);"">Đặt Lại Mật Khẩu</a>
                </div>
                <p style=""color: #64748b; font-size: 13px;"">Liên kết này có hiệu lực trong vòng <strong>60 phút</strong>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email hoặc thông báo cho bộ phận an ninh thông tin.</p>
                <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"" />
                <p style=""color: #94a3b8; font-size: 12px; margin: 0;"">HR Portal - Nền tảng tuyển dụng & phát triển nhân tài toàn diện.</p>
            </div>";

        await emailService.SendEmailAsync(user.Email, "[HR Portal] Yêu cầu khôi phục mật khẩu", htmlBody, cancellationToken);
        return true;
    }
}
