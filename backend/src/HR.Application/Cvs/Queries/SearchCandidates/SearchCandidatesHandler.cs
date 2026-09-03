using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Cvs.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Cvs.Queries.SearchCandidates;

public class SearchCandidatesHandler : IRequestHandler<SearchCandidatesQuery, List<CandidateProfileDto>>
{
    private readonly IApplicationDbContext _context;

    public SearchCandidatesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CandidateProfileDto>> Handle(SearchCandidatesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Candidates
            .Include(c => c.CandidateSkills)
                .ThenInclude(cs => cs.Skill)
            .AsNoTracking();

        // 1. Chỉ hiển thị ứng viên có visibilityStatus = PUBLIC
        query = query.Where(c => c.VisibilityStatus == CandidateVisibilityStatus.PUBLIC);

        // 2. Lọc theo search (Tên hoặc Tóm tắt kinh nghiệm)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchKw = request.Search.ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(searchKw) || 
                                     (c.Objective != null && c.Objective.ToLower().Contains(searchKw)));
        }

        // 3. Lọc theo skill
        if (!string.IsNullOrWhiteSpace(request.Skill))
        {
            var skillKw = request.Skill.ToLower();
            query = query.Where(c => c.CandidateSkills.Any(cs => cs.Skill.SkillName.ToLower().Contains(skillKw)));
        }

        // 4. Phân trang
        var pagedCandidates = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return pagedCandidates.Select(c => new CandidateProfileDto(
            c.Id,
            c.FullName,
            c.AvatarUrl,
            c.Gender?.ToString(),
            c.BirthDate,
            c.Objective,
            c.CandidateSkills.Select(cs => cs.Skill.SkillName).ToList(),
            c.VisibilityStatus.ToString()
        )).ToList();
    }
}
