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

/// <summary>
/// Kết quả sinh câu hỏi phỏng vấn AI theo từng category
/// </summary>
public class InterviewQuestionsResult
{
    public string JobTitle { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public List<InterviewQuestionCategory> Categories { get; set; } = new();
}

public class InterviewQuestionCategory
{
    public string CategoryName { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public List<InterviewQuestion> Questions { get; set; } = new();
}

public class InterviewQuestion
{
    public string Question { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty; // Easy, Medium, Hard
    public string ExpectedAnswer { get; set; } = string.Empty;
}

public class AssessmentQuestionItem
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new(); // 4 options A, B, C, D
    public int CorrectOptionIndex { get; set; } // 0, 1, 2, 3
    public string? Explanation { get; set; }
    public string? Category { get; set; }
    public string Difficulty { get; set; } = "Medium"; // Easy, Medium, Hard
}

public interface IAiService
{
    Task<JobFitAnalysisResult> AnalyzeJobFitAsync(int candidateUserId, int jobId, CancellationToken cancellationToken = default);
    Task<GenerateJdResult> GenerateJobDescriptionAsync(string title, string? keywords, CancellationToken cancellationToken = default);
    Task<string> ChatWithAssistantAsync(int userId, string message, int? currentJobId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// AI sinh bộ câu hỏi phỏng vấn dựa trên JD của Job và hồ sơ ứng viên
    /// </summary>
    Task<InterviewQuestionsResult> GenerateInterviewQuestionsAsync(int jobId, int candidateUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// AI sinh bộ câu hỏi trắc nghiệm đánh giá năng lực theo JD và loại đề thi
    /// </summary>
    Task<List<AssessmentQuestionItem>> GenerateAssessmentQuestionsAsync(int jobId, string testType, int totalQuestions, CancellationToken cancellationToken = default);
}
