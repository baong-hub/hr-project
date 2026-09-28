using System.Collections.Generic;

namespace HR.Application.Jobs.Dtos;

public record JobFacetsDto(
    int TotalJobs,
    Dictionary<string, int> Provinces,
    Dictionary<string, int> Categories,
    Dictionary<string, int> SalaryRanges,
    Dictionary<string, int> ExperienceLevels,
    Dictionary<string, int> EmploymentTypes,
    Dictionary<string, int> WorkModes
);
