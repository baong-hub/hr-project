namespace HR.Application.Dashboard;

public record DashboardStatsDto(
    string UserRole,
    // Candidate stats
    int AppliedJobsCount,
    int InterviewsScheduledCount,
    int SavedJobsCount,
    // Employer stats
    int ActiveJobsCount,
    int TotalApplicantsCount,
    int ShortlistedCount,
    int HiredCount,
    // Admin stats
    int TotalCandidatesCount,
    int TotalEmployersCount,
    int TotalJobsCount,
    int TotalCompaniesCount,
    int VerificationRequestsCount
);
