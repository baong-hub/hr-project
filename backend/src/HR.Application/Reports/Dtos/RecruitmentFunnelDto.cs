using System.Collections.Generic;

namespace HR.Application.Reports.Dtos;

public record RecruitmentFunnelDto(
    List<FunnelStageDto> Stages
);

public record FunnelStageDto(
    string Stage,
    int Count
);
