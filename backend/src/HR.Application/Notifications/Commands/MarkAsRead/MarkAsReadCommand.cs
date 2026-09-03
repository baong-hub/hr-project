using MediatR;

namespace HR.Application.Notifications.Commands.MarkAsRead;

public record MarkAsReadCommand(int Id) : IRequest<bool>;
