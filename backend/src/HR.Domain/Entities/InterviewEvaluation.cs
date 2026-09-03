using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class InterviewEvaluation : BaseEntity
{
    public int InterviewId { get; set; }
    public decimal TechnicalScore { get; set; }
    public decimal CommunicationScore { get; set; }
    public decimal ProblemSolvingScore { get; set; }
    public decimal ExperienceScore { get; set; }
    public decimal CultureFitScore { get; set; }
    public decimal SalaryExpectationScore { get; set; }
    public decimal OverallScore { get; set; }
    public EvaluationResult Result { get; set; }
    public string? Comments { get; set; }

    // Navigation
    public Interview Interview { get; set; } = null!;
}
