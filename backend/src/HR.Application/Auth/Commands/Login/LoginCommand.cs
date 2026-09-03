using MediatR;
using HR.Application.Auth.Dtos;

namespace HR.Application.Auth.Commands.Login;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<LoginResultDto>;
