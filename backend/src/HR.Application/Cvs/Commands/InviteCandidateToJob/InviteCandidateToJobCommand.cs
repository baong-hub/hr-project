using MediatR;

namespace HR.Application.Cvs.Commands.InviteCandidateToJob;

public record InviteCandidateToJobCommand(
    int CandidateId,
    int JobId,
    string? CustomMessage = null
) : IRequest<bool>;
