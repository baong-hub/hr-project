using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using HR.Domain.Enums;
using MediatR;

namespace HR.Application.UserSettings.Commands.UpdateTheme;

public record UpdateThemeCommand(ThemeMode ThemeMode) : IRequest<ApiResponse<UserSettingDto>>;

