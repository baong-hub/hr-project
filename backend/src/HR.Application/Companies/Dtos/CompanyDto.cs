using System;

namespace HR.Application.Companies.Dtos;

public record CompanyDto(
    int Id,
    string Name,
    string? LogoUrl,
    string? BannerUrl,
    string? TaxCode,
    string? Website,
    string Industry,
    string SizeRange,
    int? FoundedYear,
    string Address,
    string? Description,
    string? Benefits,
    string? Contact,
    string? SocialLinks,
    string VerificationStatus,
    int FollowersCount,
    bool? IsFollowing = null
);
