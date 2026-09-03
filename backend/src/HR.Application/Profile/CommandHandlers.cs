using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Profile;

public class ChangePasswordCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IPasswordHasher passwordHasher
) : IRequestHandler<ChangePasswordCommand, bool>
{
    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        if (userId == 0)
            throw new ForbiddenException("Không tìm thấy thông tin xác thực.");

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken);

        if (user is null)
            throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy tài khoản người dùng.");

        // Check old password
        if (!passwordHasher.Verify(request.OldPassword, user.PasswordHash))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(request.OldPassword), ["Mật khẩu cũ không chính xác."] }
            });
        }

        // Check if new password is same as old password
        if (passwordHasher.Verify(request.NewPassword, user.PasswordHash))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(request.NewPassword), ["Mật khẩu mới không được trùng với mật khẩu cũ."] }
            });
        }

        // Hash and update
        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

