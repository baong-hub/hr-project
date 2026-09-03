using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Cvs.Commands.UpdateProfile;

public class UpdateProfileHandler : IRequestHandler<UpdateProfileCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProfileHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == 0)
        {
            throw new ForbiddenException("UNAUTHORIZED", "Người dùng chưa đăng nhập.");
        }

        var candidate = await _context.Candidates
            .FirstOrDefaultAsync(c => c.Id == userId, cancellationToken);

        var isNewCandidate = false;
        if (candidate == null)
        {
            candidate = new Candidate
            {
                UserId = userId,
                FullName = _currentUserService.Username ?? "Ứng viên mới"
            };
            isNewCandidate = true;
        }

        // Cập nhật các thông tin cơ bản
        candidate.Objective = request.ExperienceSummary; // Map experienceSummary của API vào cột objective
        candidate.VisibilityStatus = Enum.Parse<CandidateVisibilityStatus>(request.VisibilityStatus);

        if (isNewCandidate)
        {
            _context.Candidates.Add(candidate);
        }
        else
        {
            _context.Candidates.Update(candidate);
        }

        // Lưu trước để lấy Candidate.Id nếu là ứng viên mới
        await _context.SaveChangesAsync(cancellationToken);

        // Xử lý đồng bộ Kỹ năng
        var skillNames = new List<string>();
        if (!string.IsNullOrWhiteSpace(request.Skills))
        {
            skillNames = request.Skills
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .ToList();
        }

        // Xóa các liên kết kỹ năng cũ
        var oldSkills = await _context.CandidateSkills
            .Where(cs => cs.CandidateId == candidate.Id)
            .ToListAsync(cancellationToken);
        _context.CandidateSkills.RemoveRange(oldSkills);

        if (skillNames.Any())
        {
            foreach (var name in skillNames)
            {
                var skill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.SkillName.ToLower() == name.ToLower(), cancellationToken);

                if (skill == null)
                {
                    skill = new Skill
                    {
                        SkillName = name,
                        Category = "General"
                    };
                    _context.Skills.Add(skill);
                    // Lưu lại để có skill.Id
                    await _context.SaveChangesAsync(cancellationToken);
                }

                var candidateSkill = new CandidateSkill
                {
                    CandidateId = candidate.Id,
                    SkillId = skill.Id
                };
                _context.CandidateSkills.Add(candidateSkill);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
