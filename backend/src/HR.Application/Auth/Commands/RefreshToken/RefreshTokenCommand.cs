using MediatR;
using HR.Application.Auth.Dtos;

namespace HR.Application.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(
    string RefreshToken
) : IRequest<LoginResultDto>;
