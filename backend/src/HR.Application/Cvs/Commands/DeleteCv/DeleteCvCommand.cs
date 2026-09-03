using MediatR;

namespace HR.Application.Cvs.Commands.DeleteCv;

public record DeleteCvCommand(int Id) : IRequest<bool>;
