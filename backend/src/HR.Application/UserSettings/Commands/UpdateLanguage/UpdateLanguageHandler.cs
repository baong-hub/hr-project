using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.UserSettings.Commands.UpdateLanguage;

public class UpdateLanguageHandler : IRequestHandler<UpdateLanguageCommand, ApiResponse<UserSettingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dateTime;

    public UpdateLanguageHandler(IApplicationDbContext context, ICurrentUserService currentUser, IDateTimeProvider dateTime)
    {
        _context = context;
        _currentUser = currentUser;
        _dateTime = dateTime;
    }

    public async Task<ApiResponse<UserSettingDto>> Handle(UpdateLanguageCommand request, CancellationToken cancellationToken)
    {
        var setting = await _context.UserSettings
            .FirstOrDefaultAsync(x => x.UserId == _currentUser.UserId, cancellationToken);

        if (setting == null)
        {
            setting = new UserSetting
            {
                UserId = (int)_currentUser.UserId,
                ThemeMode = ThemeMode.Light,
                Language = request.Language,
                CreatedAt = _dateTime.Now,
                UpdatedAt = _dateTime.Now
            };
            await _context.UserSettings.AddAsync(setting, cancellationToken);
        }
        else
        {
            setting.Language = request.Language;
            setting.UpdatedAt = _dateTime.Now;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<UserSettingDto>.Ok(new UserSettingDto
        {
            ThemeMode = setting.ThemeMode,
            Language = setting.Language,
            UpdatedAt = setting.UpdatedAt
        });
    }
}

