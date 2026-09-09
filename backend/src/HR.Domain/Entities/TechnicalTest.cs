using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class TechnicalTest : BaseEntity
{
    public int ApplicationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public TechnicalTestType TestType { get; set; } = TechnicalTestType.TECHNICAL;
    public int DurationMinutes { get; set; } = 30;
    public int PassingScore { get; set; } = 70;
    public int TotalQuestions { get; set; } = 0;
    public int CorrectAnswersCount { get; set; } = 0;
    public int Score { get; set; } = 0; // % hoặc thang điểm 100
    public TechnicalTestStatus Status { get; set; } = TechnicalTestStatus.PENDING;
    public DateTime? StartTime { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? QuestionsData { get; set; } // JSON snapshot của bộ câu hỏi đề thi
    public string? AnswersData { get; set; } // JSON câu trả lời của ứng viên
    public string? Notes { get; set; }

    // Navigation
    public Application Application { get; set; } = null!;
}
