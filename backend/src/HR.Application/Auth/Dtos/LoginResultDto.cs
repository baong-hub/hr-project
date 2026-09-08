using System.Collections.Generic;

namespace HR.Application.Auth.Dtos;

public class LoginResultDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserInfoDto User { get; set; } = null!;
}

public class UserInfoDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyLogoUrl { get; set; }
    public List<string> Permissions { get; set; } = [];
}
