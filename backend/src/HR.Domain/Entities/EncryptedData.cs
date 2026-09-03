// using HR.Domain.Common;

namespace HR.Domain.Entities;

public class EncryptedData : BaseEntity
{
    public string ModuleName { get; set; } = null!;
    public int EntityId { get; set; }
    public string FieldName { get; set; } = null!;
    public string EncryptedValue { get; set; } = null!;
    public string? ValueHash { get; set; }
}


