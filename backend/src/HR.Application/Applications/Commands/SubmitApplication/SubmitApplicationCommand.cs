using MediatR;
using HR.Application.Common.Models;

namespace HR.Application.Applications.Commands.SubmitApplication;

public record SubmitApplicationCommand(
    int JobId,
    int CandidateCvId,
    string? CoverLetter
) : IRequest<ApiResponse<ApplicationDto>>;
