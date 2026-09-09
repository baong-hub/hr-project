using System;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class JobOffer : BaseEntity
{
    public int ApplicationId { get; set; }
    public int JobId { get; set; }
    public int CandidateId { get; set; }
    public int CreatedByEmployerId { get; set; }

    // Chức danh & Nơi làm việc
    public string PositionTitle { get; set; } = null!;
    public string? DepartmentName { get; set; }
    public string? WorkLocation { get; set; }
    public string? WorkingHours { get; set; }

    // Lương & Chế độ đãi ngộ
    public decimal BasicSalary { get; set; }
    public decimal Allowance { get; set; }
    public OfferSalaryType SalaryType { get; set; } = OfferSalaryType.GROSS;
    public string Currency { get; set; } = "VND";

    // Thử việc
    public int ProbationPeriodMonths { get; set; } = 2;
    public decimal ProbationSalaryPercentage { get; set; } = 85;

    // Thời gian
    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.Now;
    public DateTime? RespondedAt { get; set; }

    // Đãi ngộ & Điều khoản
    public string? Benefits { get; set; }
    public string? SpecialTerms { get; set; }
    public string? Notes { get; set; }

    // File đính kèm PDF Offer Letter
    public string? OfferLetterFileUrl { get; set; }
    public string? OfferLetterFileName { get; set; }

    // Trạng thái & Tương tác 2 chiều
    public JobOfferStatus Status { get; set; } = JobOfferStatus.PENDING;
    public string? CandidateResponseNote { get; set; }
    public decimal? CandidateDesiredSalary { get; set; }
    public string? DeclineReason { get; set; }

    // Navigation
    public Application Application { get; set; } = null!;
    public Job Job { get; set; } = null!;
    public Candidate Candidate { get; set; } = null!;
    public Employer CreatedByEmployer { get; set; } = null!;
}
