using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using HR.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.UserSettings.Commands.UpdateTheme;

public class UpdateThemeHandler : IRequestHandler<UpdateThemeCommand, ApiResponse<UserSettingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dateTime;

    public UpdateThemeHandler(IApplicationDbContext context, ICurrentUserService currentUser, IDateTimeProvider dateTime)
    {
        _context = context;
        _currentUser = currentUser;
        _dateTime = dateTime;
    }

    public async Task<ApiResponse<UserSettingDto>> Handle(UpdateThemeCommand request, CancellationToken cancellationToken)
    {
        var setting = await _context.UserSettings
            .FirstOrDefaultAsync(x => x.UserId == _currentUser.UserId, cancellationToken);

        if (setting == null)
        {
            setting = new UserSetting
            {
                UserId = (int)_currentUser.UserId,
                ThemeMode = request.ThemeMode,
                CreatedAt = _dateTime.Now,
                UpdatedAt = _dateTime.Now
            };
            await _context.UserSettings.AddAsync(setting, cancellationToken);
        }
        else
        {
            setting.ThemeMode = request.ThemeMode;
            // UpdatedAt handled by DbContext or manually
            setting.UpdatedAt = _dateTime.Now;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<UserSettingDto>.Ok(new UserSettingDto
        {
            ThemeMode = setting.ThemeMode,
            UpdatedAt = setting.UpdatedAt
        });
    }
}

