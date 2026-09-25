using System.Collections.Generic;

namespace HR.Application.SalaryInsights.Dtos;

public record SalaryBenchmarkDto(
    string Title,
    decimal MinSalaryMillionVnd,
    decimal MaxSalaryMillionVnd,
    decimal MedianSalaryMillionVnd,
    decimal P25MillionVnd,
    decimal P75MillionVnd,
    int SampleCount
);

public record SkillSalaryDto(
    string Skill,
    decimal MedianSalaryMillionVnd,
    int JobCount
);

public record CategorySalaryDto(
    string Category,
    decimal MedianSalaryMillionVnd,
    decimal MinSalaryMillionVnd,
    decimal MaxSalaryMillionVnd,
    int JobCount
);

public record SalaryInsightsResultDto(
    string QueryCategory,
    string QueryLocation,
    decimal OverallAverageMillionVnd,
    decimal OverallMedianMillionVnd,
    decimal OverallP25MillionVnd,
    decimal OverallP75MillionVnd,
    int TotalJobsAnalyzed,
    List<SalaryBenchmarkDto> ByExperienceLevel,
    List<CategorySalaryDto> ByCategory,
    List<SkillSalaryDto> TopPayingSkills
);
