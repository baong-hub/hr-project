using MediatR;
using HR.Application.Common.Models;
using HR.Application.Notifications.Dtos;

namespace HR.Application.Notifications.Queries.GetNotifications;

public record GetNotificationsQuery(int Page = 1, int PageSize = 10) 
    : IRequest<PagedResult<NotificationDto>>;
