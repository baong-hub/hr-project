namespace HR.Application.Companies.Dtos;

public record FollowResultDto(
    int CompanyId,
    bool IsFollowing,
    int FollowersCount
);
