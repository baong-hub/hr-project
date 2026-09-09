using System.Collections.Generic;

namespace HR.Application.Reports.Dtos;

public record TopJobSummaryDto(
    int JobId,
    string Title,
    int Views,
    int Applications,
    double ApplyRate,
    string Status
);

public record EmployerSummaryDto(
    int TotalActiveJobs,
    int TotalApplications,
    int TotalViews,
    double AverageApplyRate,
    int TotalInterviews = 0,
    int CompletedInterviews = 0,
    int TotalOffers = 0,
    int TotalHired = 0,
    double AverageTimeToHireDays = 0,
    double OfferAcceptanceRate = 0,
    List<TopJobSummaryDto>? TopJobs = null
);
