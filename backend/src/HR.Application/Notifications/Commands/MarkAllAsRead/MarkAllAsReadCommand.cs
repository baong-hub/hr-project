using MediatR;

namespace HR.Application.Notifications.Commands.MarkAllAsRead;

public record MarkAllAsReadCommand : IRequest<bool>;
