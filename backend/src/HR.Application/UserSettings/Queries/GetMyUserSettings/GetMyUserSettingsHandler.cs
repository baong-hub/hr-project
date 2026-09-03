using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.UserSettings.Queries.GetMyUserSettings;

public class GetMyUserSettingsHandler : IRequestHandler<GetMyUserSettingsQuery, ApiResponse<UserSettingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMyUserSettingsHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<UserSettingDto>> Handle(GetMyUserSettingsQuery request, CancellationToken cancellationToken)
    {
        var setting = await _context.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == _currentUser.UserId, cancellationToken);
            
        if (setting == null)
        {
            // Return default settings if none exists
            return ApiResponse<UserSettingDto>.Ok(new UserSettingDto
            {
                ThemeMode = ThemeMode.Light,
                Language = "vi",
                UpdatedAt = DateTime.Now
            });
        }
        
        return ApiResponse<UserSettingDto>.Ok(new UserSettingDto
        {
            ThemeMode = setting.ThemeMode,
            Language = setting.Language,
            UpdatedAt = setting.UpdatedAt
        });
    }
}

