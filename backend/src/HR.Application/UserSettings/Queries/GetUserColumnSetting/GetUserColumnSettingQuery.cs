using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using MediatR;

namespace HR.Application.UserSettings.Queries.GetUserColumnSetting;

public record GetUserColumnSettingQuery(string GridKey) : IRequest<ApiResponse<UserColumnSettingDto>>;

