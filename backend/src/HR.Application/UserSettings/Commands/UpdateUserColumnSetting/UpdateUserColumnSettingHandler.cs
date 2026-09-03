using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using HR.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.UserSettings.Commands.UpdateUserColumnSetting;

public class UpdateUserColumnSettingHandler : IRequestHandler<UpdateUserColumnSettingCommand, ApiResponse<UserColumnSettingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dateTime;

    public UpdateUserColumnSettingHandler(IApplicationDbContext context, ICurrentUserService currentUser, IDateTimeProvider dateTime)
    {
        _context = context;
        _currentUser = currentUser;
        _dateTime = dateTime;
    }

    public async Task<ApiResponse<UserColumnSettingDto>> Handle(UpdateUserColumnSettingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId <= 0)
        {
            return ApiResponse<UserColumnSettingDto>.Fail("UNAUTHORIZED", "Người dùng chưa đăng nhập");
        }

        var setting = await _context.UserColumnSettings
            .FirstOrDefaultAsync(x => x.UserId == userId && x.GridKey == request.GridKey, cancellationToken);

        if (setting == null)
        {
            setting = new UserColumnSetting
            {
                UserId = (int)userId,
                GridKey = request.GridKey,
                ColumnSettingsJson = request.ColumnSettingsJson,
                CreatedAt = _dateTime.Now,
                UpdatedAt = _dateTime.Now
            };
            await _context.UserColumnSettings.AddAsync(setting, cancellationToken);
        }
        else
        {
            setting.ColumnSettingsJson = request.ColumnSettingsJson;
            setting.UpdatedAt = _dateTime.Now;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<UserColumnSettingDto>.Ok(new UserColumnSettingDto
        {
            GridKey = setting.GridKey,
            ColumnSettingsJson = setting.ColumnSettingsJson,
            UpdatedAt = setting.UpdatedAt
        });
    }
}

