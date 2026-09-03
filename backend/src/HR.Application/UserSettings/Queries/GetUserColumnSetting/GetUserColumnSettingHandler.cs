using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.UserSettings.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.UserSettings.Queries.GetUserColumnSetting;

public class GetUserColumnSettingHandler : IRequestHandler<GetUserColumnSettingQuery, ApiResponse<UserColumnSettingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetUserColumnSettingHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<UserColumnSettingDto>> Handle(GetUserColumnSettingQuery request, CancellationToken cancellationToken)
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
            return ApiResponse<UserColumnSettingDto>.Ok(new UserColumnSettingDto
            {
                GridKey = request.GridKey,
                ColumnSettingsJson = string.Empty
            });
        }

        return ApiResponse<UserColumnSettingDto>.Ok(new UserColumnSettingDto
        {
            GridKey = setting.GridKey,
            ColumnSettingsJson = setting.ColumnSettingsJson,
            UpdatedAt = setting.UpdatedAt
        });
    }
}

