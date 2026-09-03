using MediatR;

namespace HR.Application.Auth.Commands.Logout;

public record LogoutCommand(
    string RefreshToken
) : IRequest<bool>;
