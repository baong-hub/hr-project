using MediatR;

namespace HR.Application.Cvs.Commands.UpdateProfile;

public record UpdateProfileCommand(
    string? Skills,
    string? ExperienceSummary,
    string VisibilityStatus
) : IRequest<bool>;
