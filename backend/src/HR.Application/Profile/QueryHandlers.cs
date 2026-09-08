using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Profile;

public class GetMyProfileQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService
) : IRequestHandler<GetMyProfileQuery, UserProfileDto>
{
    public async Task<UserProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        if (userId == 0)
            throw new ForbiddenException("Không tìm thấy thông tin xác thực.");

        var user = await context.Users
            .AsNoTracking()
            .Include(u => u.Site)
            .Include(u => u.Candidate)
            .Include(u => u.Employer)
                .ThenInclude(e => e!.Company)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken);

        if (user is null)
            throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng hoặc tài khoản đã bị khóa.");

        var positionNames = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role.Name)
            .Distinct()
            .ToList();

        var deptName = !string.IsNullOrWhiteSpace(user.Site?.Name) ? user.Site.Name : (user.Employer?.Company?.Name ?? "Trụ sở chính");
        var email = !string.IsNullOrWhiteSpace(user.Email) ? user.Email : $"{user.Username}@hr.local";
        var phone = !string.IsNullOrWhiteSpace(user.PhoneNumber) ? user.PhoneNumber : (!string.IsNullOrWhiteSpace(user.Phone) ? user.Phone : "Chưa cập nhật");
        var fullName = !string.IsNullOrWhiteSpace(user.FullName) 
            ? user.FullName 
            : (user.Candidate?.FullName ?? user.Employer?.Company?.Name ?? user.Username);
        var staffCode = user.Username;
        var avatarUrl = user.AvatarUrl ?? user.Candidate?.AvatarUrl ?? user.Employer?.Company?.LogoUrl;

        return new UserProfileDto(
            Id: user.Id,
            Username: user.Username,
            FullName: fullName,
            StaffCode: staffCode,
            DepartmentName: deptName,
            PositionNames: positionNames.Count != 0 ? positionNames : ["Nhân viên"],
            Email: email,
            Phone: phone,
            AvatarUrl: avatarUrl
        );
    }
}
