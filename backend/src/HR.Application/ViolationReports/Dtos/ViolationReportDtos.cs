using System;
using HR.Domain.Enums;

namespace HR.Application.ViolationReports.Dtos;

public class ViolationReportDto
{
    public int Id { get; set; }
    public int ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public ViolationTargetType TargetType { get; set; }
    public int TargetId { get; set; }
    public string TargetTitle { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ViolationStatus Status { get; set; }
    public string? Resolution { get; set; }
    public int? ResolvedById { get; set; }
    public string? ResolvedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateViolationReportRequest
{
    public ViolationTargetType TargetType { get; set; } = ViolationTargetType.JOB;
    public int TargetId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class ResolveViolationReportRequest
{
    public ViolationStatus Status { get; set; } = ViolationStatus.RESOLVED;
    public string Resolution { get; set; } = string.Empty;
    public bool HideTarget { get; set; } = false; // Nếu true, ẩn/khóa tin tuyển dụng hoặc công ty vi phạm
}
