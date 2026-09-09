using System;
using HR.Domain.Enums;

namespace HR.Application.JobOffers.Dtos;

public class JobOfferDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyLogo { get; set; }
    public int CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string? CandidatePhone { get; set; }

    public string PositionTitle { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public string? WorkLocation { get; set; }
    public string? WorkingHours { get; set; }

    public decimal BasicSalary { get; set; }
    public decimal Allowance { get; set; }
    public decimal TotalSalary => BasicSalary + Allowance;
    public OfferSalaryType SalaryType { get; set; }
    public string Currency { get; set; } = "VND";

    public int ProbationPeriodMonths { get; set; }
    public decimal ProbationSalaryPercentage { get; set; }
    public decimal ProbationSalary => (BasicSalary * ProbationSalaryPercentage / 100m) + Allowance;

    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? RespondedAt { get; set; }

    public string? Benefits { get; set; }
    public string? SpecialTerms { get; set; }
    public string? Notes { get; set; }

    public string? OfferLetterFileUrl { get; set; }
    public string? OfferLetterFileName { get; set; }

    public JobOfferStatus Status { get; set; }
    public string? CandidateResponseNote { get; set; }
    public decimal? CandidateDesiredSalary { get; set; }
    public string? DeclineReason { get; set; }

    public bool IsExpired => Status == JobOfferStatus.PENDING && DateTime.Now > ExpiryDate;

    public static JobOfferDto FromEntity(HR.Domain.Entities.JobOffer offer)
    {
        return new JobOfferDto
        {
            Id = offer.Id,
            ApplicationId = offer.ApplicationId,
            JobId = offer.JobId,
            JobTitle = offer.Job?.Title ?? string.Empty,
            CompanyName = offer.Job?.Company?.Name ?? string.Empty,
            CompanyLogo = offer.Job?.Company?.LogoUrl,
            CandidateId = offer.CandidateId,
            CandidateName = offer.Candidate?.FullName ?? string.Empty,
            CandidateEmail = offer.Candidate?.User?.Email ?? string.Empty,
            CandidatePhone = offer.Candidate?.User?.Phone ?? offer.Candidate?.User?.PhoneNumber,
            PositionTitle = offer.PositionTitle,
            DepartmentName = offer.DepartmentName,
            WorkLocation = offer.WorkLocation,
            WorkingHours = offer.WorkingHours,
            BasicSalary = offer.BasicSalary,
            Allowance = offer.Allowance,
            SalaryType = offer.SalaryType,
            Currency = offer.Currency,
            ProbationPeriodMonths = offer.ProbationPeriodMonths,
            ProbationSalaryPercentage = offer.ProbationSalaryPercentage,
            StartDate = offer.StartDate,
            ExpiryDate = offer.ExpiryDate,
            IssuedAt = offer.IssuedAt,
            RespondedAt = offer.RespondedAt,
            Benefits = offer.Benefits,
            SpecialTerms = offer.SpecialTerms,
            Notes = offer.Notes,
            OfferLetterFileUrl = offer.OfferLetterFileUrl,
            OfferLetterFileName = offer.OfferLetterFileName,
            Status = offer.Status,
            CandidateResponseNote = offer.CandidateResponseNote,
            CandidateDesiredSalary = offer.CandidateDesiredSalary,
            DeclineReason = offer.DeclineReason
        };
    }
}

public class CreateJobOfferRequest
{
    public int ApplicationId { get; set; }
    public string? CandidateEmail { get; set; }
    public string PositionTitle { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public string? WorkLocation { get; set; }
    public string? WorkingHours { get; set; }

    public decimal BasicSalary { get; set; }
    public decimal Allowance { get; set; }
    public OfferSalaryType SalaryType { get; set; } = OfferSalaryType.GROSS;
    public string Currency { get; set; } = "VND";

    public int ProbationPeriodMonths { get; set; } = 2;
    public decimal ProbationSalaryPercentage { get; set; } = 85;

    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }

    public string? Benefits { get; set; }
    public string? SpecialTerms { get; set; }
    public string? Notes { get; set; }

    public string? OfferLetterFileUrl { get; set; }
    public string? OfferLetterFileName { get; set; }
}

public class RespondJobOfferRequest
{
    /// <summary>
    /// ACCEPT, NEGOTIATE, DECLINE
    /// </summary>
    public string Action { get; set; } = string.Empty;
    public decimal? DesiredSalary { get; set; }
    public string? Note { get; set; }
    public string? DeclineReason { get; set; }
}
