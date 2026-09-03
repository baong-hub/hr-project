using System;

namespace HR.Domain.Entities;

public class CandidateCertificate : BaseEntity
{
    public int CandidateId { get; set; }
    public string CertificateName { get; set; } = string.Empty;
    public string? IssuedBy { get; set; }
    public DateTime? IssuedDate { get; set; }
    public DateTime? ExpirationDate { get; set; }

    // Navigation
    public Candidate Candidate { get; set; } = null!;
}
