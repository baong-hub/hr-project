namespace HR.Application.Common.Interfaces;

public interface IAuditableCommand
{
    string ModuleName { get; }
    int? EntityId { get; }
    string AuditAction { get; } // CREATE, UPDATE, DELETE
    bool SkipAudit => false;
}

