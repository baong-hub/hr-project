using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using MediatR;

namespace HR.Application.UserSettings.Commands.UpdateLanguage;

public record UpdateLanguageCommand(string Language) : IRequest<ApiResponse<UserSettingDto>>;

