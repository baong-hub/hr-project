using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using MediatR;

namespace HR.Application.UserSettings.Queries.GetMyUserSettings;

public record GetMyUserSettingsQuery() : IRequest<ApiResponse<UserSettingDto>>;

