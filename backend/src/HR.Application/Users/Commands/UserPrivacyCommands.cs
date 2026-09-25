using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Users.Commands;

public record ExportUserDataResultDto(
    int UserId,
    string Email,
    string FullName,
    string? PhoneNumber,
    DateTime CreatedAt,
    object? CandidateProfile,
    List<object> Applications,
    List<object> SavedJobs,
    string ExportedAt,
    string LegalNotice
);

public record ExportUserDataQuery(int UserId) : IRequest<ExportUserDataResultDto?>;

public class ExportUserDataHandler : IRequestHandler<ExportUserDataQuery, ExportUserDataResultDto?>
{
    private readonly IApplicationDbContext _context;

    public ExportUserDataHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ExportUserDataResultDto?> Handle(ExportUserDataQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.DeletedAt == null, cancellationToken);

        if (user == null) return null;

        var candidate = await _context.Candidates
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == user.Id, cancellationToken);

        object? candidateProfile = null;
        if (candidate != null)
        {
            var educations = await _context.CandidateEducations.Where(e => e.CandidateId == candidate.Id).ToListAsync(cancellationToken);
            var experiences = await _context.CandidateExperiences.Where(e => e.CandidateId == candidate.Id).ToListAsync(cancellationToken);
            var skills = await _context.CandidateSkills.Where(s => s.CandidateId == candidate.Id).ToListAsync(cancellationToken);

            candidateProfile = new
            {
                candidate.Id,
                candidate.FullName,
                candidate.Objective,
                candidate.ExperienceSummary,
                candidate.Skills,
                Educations = educations,
                Experiences = experiences,
                CandidateSkills = skills
            };
        }

        var applications = await _context.Applications
            .AsNoTracking()
            .Where(a => a.CandidateId == user.Id && a.DeletedAt == null)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.JobId,
                Status = a.Status.ToString(),
                a.AppliedAt,
                a.CreatedAt
            })
            .Cast<object>()
            .ToListAsync(cancellationToken);

        var savedJobs = await _context.SavedJobs
            .AsNoTracking()
            .Where(s => s.CandidateId == user.Id)
            .Select(s => new
            {
                s.JobId,
                s.SavedAt
            })
            .Cast<object>()
            .ToListAsync(cancellationToken);

        return new ExportUserDataResultDto(
            UserId: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            PhoneNumber: user.PhoneNumber,
            CreatedAt: user.CreatedAt,
            CandidateProfile: candidateProfile,
            Applications: applications,
            SavedJobs: savedJobs,
            ExportedAt: DateTime.UtcNow.ToString("O"),
            LegalNotice: "Bản sao lưu dữ liệu cá nhân theo quy định tại Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân."
        );
    }
}

public record AnonymizeUserCommand(int UserId) : IRequest<bool>;

public class AnonymizeUserHandler : IRequestHandler<AnonymizeUserCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AnonymizeUserHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AnonymizeUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null) return false;

        // Anonymize personal identifiable information
        user.FullName = $"Ẩn danh #{user.Id}";
        user.Email = $"anonymized_{user.Id}_{Guid.NewGuid().ToString()[..6]}@deleted.local";
        user.PhoneNumber = string.Empty;
        user.AvatarUrl = null;
        user.IsActive = false;
        user.DeletedAt = DateTime.UtcNow;

        // Anonymize candidate profile if exists
        var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.Id == user.Id, cancellationToken);
        if (candidate != null)
        {
            candidate.FullName = $"Ẩn danh #{user.Id}";
            candidate.AvatarUrl = null;
            candidate.Objective = null;
            candidate.ExperienceSummary = null;
            candidate.Skills = null;
            candidate.DeletedAt = DateTime.UtcNow;
        }

        // Revoke active refresh tokens
        var tokens = await _context.RefreshTokens.Where(t => t.UserId == user.Id).ToListAsync(cancellationToken);
        foreach (var t in tokens)
        {
            t.IsRevoked = true;
        }

        // Remove active sessions
        var sessions = await _context.UserSessions.Where(s => s.UserId == user.Id).ToListAsync(cancellationToken);
        _context.UserSessions.RemoveRange(sessions);

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
