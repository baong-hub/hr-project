namespace HR.Application.Profile;

public record UserProfileDto(
    int Id,
    string Username,
    string FullName,
    string? StaffCode,
    string? DepartmentName,
    List<string> PositionNames,
    string? Email,
    string? Phone,
    string? AvatarUrl
);

public record ChangePasswordRequestDto(
    string OldPassword,
    string NewPassword,
    string ConfirmPassword
);

