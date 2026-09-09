using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class JobAssessmentTemplate : BaseEntity
{
    public int JobId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TechnicalTestType TestType { get; set; } = TechnicalTestType.TECHNICAL;
    public int DurationMinutes { get; set; } = 30;
    public int PassingScore { get; set; } = 70;
    public int TotalQuestions { get; set; } = 10;
    public string QuestionsData { get; set; } = "[]"; // JSON chứa danh sách câu hỏi đề thi
    public bool AutoInviteOnApply { get; set; } = false;
    public bool AutoInviteOnScreening { get; set; } = true;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Job Job { get; set; } = null!;
}
