using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using MediatR;

namespace HR.Application.UserSettings.Commands.UpdateUserColumnSetting;

public record UpdateUserColumnSettingCommand(
    string GridKey,
    string ColumnSettingsJson
) : IRequest<ApiResponse<UserColumnSettingDto>>;

