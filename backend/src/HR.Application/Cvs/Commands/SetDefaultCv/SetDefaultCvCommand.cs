using MediatR;

namespace HR.Application.Cvs.Commands.SetDefaultCv;

public record SetDefaultCvCommand(int Id) : IRequest<bool>;
