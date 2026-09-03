// No using needed for BaseEntity as it's in the same namespace

namespace HR.Domain.Entities;

public class LogActivity : BaseEntity
{
    public string ModuleName { get; set; } = null!;
    public int? EntityId { get; set; }
    public string Action { get; set; } = null!; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT
    public int? UserId { get; set; }
    public string? BeforeValue { get; set; }
    public string? AfterValue { get; set; }

    public string? IpAddress { get; set; }
    public string? Device { get; set; }
    public string? OperatingSystem { get; set; }
    public string? Browser { get; set; }

    public User? User { get; set; }
}

