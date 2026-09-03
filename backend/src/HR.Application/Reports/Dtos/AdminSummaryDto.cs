namespace HR.Application.Reports.Dtos;

public record AdminSummaryDto(
    int TotalCompanies,
    int TotalCandidates,
    int TotalJobs,
    int TotalApplications
);
