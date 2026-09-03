using MediatR;

namespace HR.Application.Profile;

public record ChangePasswordCommand(
    string OldPassword,
    string NewPassword,
    string ConfirmPassword
) : IRequest<bool>;

