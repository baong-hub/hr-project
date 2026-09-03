using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class CandidateCv : BaseEntity
{
    public int CandidateId { get; set; }
    public string CvTitle { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public bool IsDefault { get; set; } = false;
    public long? FileSizeBytes { get; set; }
    public CvType CvType { get; set; } = CvType.UPLOAD;

    // Navigation
    public Candidate Candidate { get; set; } = null!;
}
