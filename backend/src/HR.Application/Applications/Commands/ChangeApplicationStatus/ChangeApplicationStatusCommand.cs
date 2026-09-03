using MediatR;
using HR.Application.Common.Models;

namespace HR.Application.Applications.Commands.ChangeApplicationStatus;

public record ChangeApplicationStatusCommand(
    int Id,
    string Status
) : IRequest<ApiResponse<bool>>;
