using MediatR;
using HR.Application.Auth.Dtos;

namespace HR.Application.Auth.Commands.RegisterCandidate;

public record RegisterCandidateCommand(
    string Email,
    string Password,
    string PhoneNumber,
    string FullName
) : IRequest<UserDto>;
