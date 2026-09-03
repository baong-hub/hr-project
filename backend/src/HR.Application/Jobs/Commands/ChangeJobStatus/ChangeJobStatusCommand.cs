using MediatR;

namespace HR.Application.Jobs.Commands.ChangeJobStatus;

public record ChangeJobStatusCommand(
    int Id,
    string Status,
    string? Note = null
) : IRequest<bool>;
