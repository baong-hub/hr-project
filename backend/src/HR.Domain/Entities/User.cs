using System;
using System.Collections.Generic;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? FullName { get; set; }
    public string? Address { get; set; }
    public AccountType AccountType { get; set; }
    public string? AvatarUrl { get; set; }
    public int SiteId { get; set; }
    public bool IsActive { get; set; } = true;
    public int RoleId { get; set; }
    public UserStatus Status { get; set; } = UserStatus.ACTIVE;

    // Navigation
    public Role Role { get; set; } = null!;
    public Site Site { get; set; } = null!;
    public Candidate? Candidate { get; set; }
    public Employer? Employer { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
    public ICollection<UserSite> UserSites { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
