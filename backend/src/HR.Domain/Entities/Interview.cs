using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Interview : BaseEntity
{
    public int ApplicationId { get; set; }
    public int RoundNumber { get; set; } = 1;
    public string RoundName { get; set; } = null!;
    public int InterviewerId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public InterviewType InterviewType { get; set; } = InterviewType.ONLINE;
    public string? LocationOrLink { get; set; }
    public string? Notes { get; set; }
    public InterviewStatus Status { get; set; } = InterviewStatus.INTERVIEW_INVITATION;

    // Navigation
    public Application Application { get; set; } = null!;
    public Employer Interviewer { get; set; } = null!;
    public ICollection<InterviewEvaluation> Evaluations { get; set; } = new List<InterviewEvaluation>();
}
