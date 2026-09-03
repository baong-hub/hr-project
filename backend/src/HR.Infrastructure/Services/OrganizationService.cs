using HR.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HR.Infrastructure.Services;

public class OrganizationService : IOrganizationService
{
    private readonly IApplicationDbContext _context;

    public OrganizationService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<int>> GetAllowedUserIdsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var allowedUserIds = new HashSet<int> { userId };

        // Get directly assigned user data permissions
        var customTargetUserIds = await _context.UserDataPermissions
            .AsNoTracking()
            .Where(udp => udp.UserId == userId)
            .Select(udp => udp.TargetUserId)
            .ToListAsync(cancellationToken);

        foreach (var targetId in customTargetUserIds)
        {
            allowedUserIds.Add(targetId);
        }

        return allowedUserIds.ToList();
    }
}
