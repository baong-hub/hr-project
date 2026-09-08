using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public class JobFitAnalysisResult
{
    public int MatchScore { get; set; }
    public string MatchLevel { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<string> Strengths { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
}

public class GenerateJdResult
{
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Benefits { get; set; } = string.Empty;
}

public interface IAiService
{
    Task<JobFitAnalysisResult> AnalyzeJobFitAsync(int candidateUserId, int jobId, CancellationToken cancellationToken = default);
    Task<GenerateJdResult> GenerateJobDescriptionAsync(string title, string? keywords, CancellationToken cancellationToken = default);
    Task<string> ChatWithAssistantAsync(int userId, string message, int? currentJobId = null, CancellationToken cancellationToken = default);
}
