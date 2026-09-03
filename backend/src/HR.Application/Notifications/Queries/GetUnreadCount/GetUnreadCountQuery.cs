using MediatR;
using HR.Application.Notifications.Dtos;

namespace HR.Application.Notifications.Queries.GetUnreadCount;

public record GetUnreadCountQuery : IRequest<UnreadCountDto>;
