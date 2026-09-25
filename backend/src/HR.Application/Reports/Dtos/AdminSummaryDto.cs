namespace HR.Application.Reports.Dtos;

public record AdminSummaryDto(
    int TotalCompanies,
    int TotalCandidates,
    int TotalJobs,
    int TotalApplications,
    int ActiveJobs,
    double ActiveJobsRate,
    int CandidatesTrendPercentage,
    int CompaniesTrendPercentage,
    int JobsTrendPercentage,
    int ApplicationsTrendPercentage,
    string JobsTrendLabel,
    string ApplicationsTrendLabel
);
