using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Cvs.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Cvs.Queries.GetCandidateProfile;

public class GetMyCandidateProfileHandler : IRequestHandler<GetMyCandidateProfileQuery, CandidateProfileDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyCandidateProfileHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CandidateProfileDto?> Handle(GetMyCandidateProfileQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId <= 0) return null;

        var candidate = await _context.Candidates
            .Include(c => c.User)
            .Include(c => c.CandidateSkills)
                .ThenInclude(cs => cs.Skill)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == userId, cancellationToken);

        if (candidate == null)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null) return null;

            return new CandidateProfileDto(
                user.Id,
                user.FullName ?? "Ứng viên",
                user.AvatarUrl,
                null,
                null,
                string.Empty,
                new System.Collections.Generic.List<string>(),
                "PRIVATE"
            );
        }

        return new CandidateProfileDto(
            candidate.Id,
            string.IsNullOrWhiteSpace(candidate.FullName) ? (candidate.User?.FullName ?? "Ứng viên") : candidate.FullName,
            candidate.AvatarUrl ?? candidate.User?.AvatarUrl,
            candidate.Gender?.ToString(),
            candidate.BirthDate,
            candidate.Objective,
            candidate.CandidateSkills.Select(cs => cs.Skill.SkillName).Distinct().ToList(),
            candidate.VisibilityStatus.ToString()
        );
    }
}
