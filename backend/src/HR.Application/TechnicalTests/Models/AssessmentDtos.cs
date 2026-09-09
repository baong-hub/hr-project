using System;
using System.Collections.Generic;
using HR.Domain.Enums;

namespace HR.Application.TechnicalTests.Models;

public class AssessmentQuestionDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectOptionIndex { get; set; } // 0, 1, 2, 3 (chỉ hiển thị cho NTD, ẩn khi trả cho ứng viên)
    public string? Explanation { get; set; }
    public string? Category { get; set; }
    public string Difficulty { get; set; } = "Medium";
}

public class CandidateQuestionDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public string? Category { get; set; }
    public string Difficulty { get; set; } = "Medium";
}

public class AssessmentTemplateDto
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TestType { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int PassingScore { get; set; }
    public int TotalQuestions { get; set; }
    public bool AutoInviteOnApply { get; set; }
    public bool AutoInviteOnScreening { get; set; }
    public bool IsActive { get; set; }
    public List<AssessmentQuestionDto> Questions { get; set; } = new();
}

public class TechnicalTestSummaryDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string TestType { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int PassingScore { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectAnswersCount { get; set; }
    public int Score { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? StartTime { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CandidateTestViewDto
{
    public int TestId { get; set; }
    public int ApplicationId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string TestType { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int PassingScore { get; set; }
    public int TotalQuestions { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? StartTime { get; set; }
    public DateTime? ServerCurrentTime { get; set; }
    public List<CandidateQuestionDto> Questions { get; set; } = new();
}

public class SubmitAnswerItem
{
    public int QuestionId { get; set; }
    public int SelectedOptionIndex { get; set; } // -1 nếu bỏ trống
}

public class SubmitTestResultDto
{
    public int TestId { get; set; }
    public int ApplicationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public int PassingScore { get; set; }
    public bool IsPassed { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ApplicationStatus { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}

public class TestDetailResultDto
{
    public int TestId { get; set; }
    public int ApplicationId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string TestType { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int PassingScore { get; set; }
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectAnswersCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? StartTime { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public List<AssessmentQuestionReviewDto> QuestionReviews { get; set; } = new();
}

public class AssessmentQuestionReviewDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectOptionIndex { get; set; }
    public int? CandidateSelectedOptionIndex { get; set; }
    public bool IsCorrect { get; set; }
    public string? Explanation { get; set; }
}
