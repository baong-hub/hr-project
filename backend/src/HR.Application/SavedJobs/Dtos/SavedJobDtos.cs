namespace HR.Application.SavedJobs.Dtos;

public record SaveToggleResultDto(
    int JobId,
    bool IsSaved
);

public record SavedJobDto(
    int JobId,
    string Title,
    string CompanyName,
    string? CompanyLogoUrl,
    decimal? SalaryFrom,
    decimal? SalaryTo,
    string City,
    string ExpiredAt,
    string JobStatus,
    string SavedAt
);
