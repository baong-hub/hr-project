using System;
using System.Collections.Generic;

namespace HR.Application.LogActivities.Models;

public class LogActivityDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    
    public string? BeforeValue { get; set; }
    public string? AfterValue { get; set; }
    public string? EntityCode { get; set; }
    public string? EntityName { get; set; }
    public string? IpAddress { get; set; }
    public string? Device { get; set; }
    public string? OperatingSystem { get; set; }
    public string? Browser { get; set; }
    
    public List<LogActivityChangeDto> Changes { get; set; } = new();
}

public class LogActivityChangeDto
{
    public string Field { get; set; } = string.Empty;
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
}

