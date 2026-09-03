using MediatR;
using HR.Application.Auth.Dtos;

namespace HR.Application.Auth.Commands.RegisterEmployer;

public record RegisterEmployerCommand(
    string Email,
    string Password,
    string FullName,
    string PhoneNumber,
    string Position,
    string CompanyName
) : IRequest<UserDto>;
