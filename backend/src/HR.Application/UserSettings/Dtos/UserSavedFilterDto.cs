using System;

namespace HR.Application.UserSettings.Dtos;

public class UserSavedFilterDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string GridKey { get; set; } = null!;
    public string FilterName { get; set; } = null!;
    public string FilterQueryJson { get; set; } = null!;
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

