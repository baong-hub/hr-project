namespace HR.Application.Reports.Dtos;

public record EmployerSummaryDto(
    int TotalActiveJobs,
    int TotalApplications,
    int TotalViews,
    double AverageApplyRate
);
