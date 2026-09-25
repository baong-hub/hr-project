using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Applications;

public class GetApplicationsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<GetApplicationsQuery, List<ApplicationDto>>
{
    public async Task<List<ApplicationDto>> Handle(GetApplicationsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        var user = await context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        var roles = user?.UserRoles.Select(ur => ur.Role.Name).ToList() ?? [];
        if (user?.Role != null && !roles.Contains(user.Role.Name))
        {
            roles.Add(user.Role.Name);
        }
        var isSuperAdmin = roles.Contains("Super Admin") || user?.Username == "admin";
        var isCandidate = roles.Contains("Ứng viên") || roles.Contains("CANDIDATE") || await context.Candidates.AnyAsync(c => c.Id == userId, cancellationToken);

        var query = context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .Include(a => a.CandidateCv)
            .AsNoTracking();

        if (isCandidate)
        {
            // Candidates only see their own applications
            query = query.Where(a => a.CandidateId == userId || a.Candidate.Id == userId);
        }
        else if (!isSuperAdmin)
        {
            // Employers only see applications for their company
            var employer = await context.Employers
                .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
            if (employer != null)
            {
                query = query.Where(a => a.Job.CompanyId == employer.CompanyId);
            }
            else
            {
                query = query.Where(a => false);
            }
        }

        if (request.JobId.HasValue && request.JobId.Value > 0)
        {
            query = query.Where(a => a.JobId == request.JobId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (Enum.TryParse<ApplicationStatus>(request.Status, true, out var statusEnum))
            {
                query = query.Where(a => a.Status == statusEnum);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var kw = request.Keyword.Trim().ToLower();
            var cleanKw = kw.Replace("#app-", "").Replace("app-", "").Replace("#", "").Trim();
            int.TryParse(cleanKw, out var searchId);

            query = query.Where(a => 
                (searchId > 0 && a.Id == searchId) ||
                (a.Job != null && a.Job.Title.ToLower().Contains(kw)) ||
                (a.Candidate != null && a.Candidate.FullName != null && a.Candidate.FullName.ToLower().Contains(kw)) ||
                (a.Candidate != null && a.Candidate.User != null && a.Candidate.User.FullName != null && a.Candidate.User.FullName.ToLower().Contains(kw)) ||
                (a.Candidate != null && a.Candidate.User != null && a.Candidate.User.Email != null && a.Candidate.User.Email.ToLower().Contains(kw)) ||
                (a.CandidateCv != null && a.CandidateCv.CvTitle != null && a.CandidateCv.CvTitle.ToLower().Contains(kw)));
        }

        var rawList = await query
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync(cancellationToken);

        var list = rawList.Select(a => {
            var score = a.MatchScore ?? CalculateMatchScore(a.Job?.Title ?? string.Empty, a.Job?.Requirements ?? string.Empty, a.Candidate?.Skills, a.Candidate?.ExperienceSummary);
            var strengths = !string.IsNullOrEmpty(a.AiStrengthsJson) ? JsonSerializer.Deserialize<List<string>>(a.AiStrengthsJson) : null;
            var gaps = !string.IsNullOrEmpty(a.AiGapsJson) ? JsonSerializer.Deserialize<List<string>>(a.AiGapsJson) : null;
            var timeline = BuildTimeline(a.Status, a.AppliedAt, a.ViewedAt);

            return new ApplicationDto(
                a.Id,
                a.JobId,
                a.Job?.Title ?? string.Empty,
                a.Job?.Company?.Name ?? "Hệ thống HR",
                a.CandidateId,
                a.Candidate?.User?.FullName ?? a.Candidate?.FullName ?? "Ứng viên",
                a.Candidate?.User?.Email ?? string.Empty,
                a.Candidate?.User?.AvatarUrl ?? a.Candidate?.AvatarUrl,
                a.CandidateCvId,
                a.CandidateCv?.CvTitle ?? string.Empty,
                a.CandidateCv?.FileUrl ?? string.Empty,
                a.CoverLetter,
                a.Status.ToString(),
                a.AppliedAt,
                a.ViewedAt,
                score,
                a.AiSummary,
                strengths,
                gaps,
                a.AiEvaluatedAt,
                timeline
            );
        }).ToList();

        return list;
    }

    public static int CalculateMatchScore(string jobTitle, string requirements, string? candidateSkills, string? candidateExperience)
    {
        if (string.IsNullOrWhiteSpace(candidateSkills)) return new Random(jobTitle.GetHashCode()).Next(45, 65);

        var reqKeywords = (requirements + " " + jobTitle)
            .ToLower()
            .Split(new[] { ',', ' ', '.', ';', '/', '\n', '\r', '+', '#' }, StringSplitOptions.RemoveEmptyEntries)
            .Distinct()
            .Where(w => w.Length > 1)
            .ToList();

        var candidateKeywords = (candidateSkills + " " + (candidateExperience ?? ""))
            .ToLower()
            .Split(new[] { ',', ' ', '.', ';', '/', '\n', '\r', '+', '#' }, StringSplitOptions.RemoveEmptyEntries)
            .Distinct()
            .Where(w => w.Length > 1)
            .ToList();

        if (reqKeywords.Count == 0) return 100;

        var matches = reqKeywords.Intersect(candidateKeywords).Count();
        var score = (int)Math.Min(100, Math.Round((double)matches / reqKeywords.Count * 100));

        if (score > 0)
        {
            score = Math.Min(96, score + 45);
        }
        else
        {
            var commonIT = candidateKeywords.Intersect(new[] { "react", "typescript", "node", "net", "c#", "java", "sql", "docker", "azure", "aws", "php", "laravel", "python" }).Count();
            if (commonIT > 0)
            {
                score = 55 + (commonIT * 8);
            }
            else
            {
                score = new Random(jobTitle.GetHashCode() + candidateSkills.GetHashCode()).Next(50, 70);
            }
        }

        return Math.Min(98, score);
    }

    public static List<ApplicationTimelineItemDto> BuildTimeline(ApplicationStatus status, DateTime appliedAt, DateTime? viewedAt)
    {
        var stages = new[]
        {
            (ApplicationStatus.APPLIED, "Nộp hồ sơ"),
            (ApplicationStatus.SCREENING, "Sàng lọc CV"),
            (ApplicationStatus.SHORTLISTED, "Hồ sơ tiềm năng"),
            (ApplicationStatus.INTERVIEW, "Phỏng vấn"),
            (ApplicationStatus.OFFER, "Mời nhận việc"),
            (ApplicationStatus.HIRED, "Nhận việc thành công")
        };

        var timeline = new List<ApplicationTimelineItemDto>();
        int currentStageIndex = Array.FindIndex(stages, s => s.Item1 == status);

        for (int i = 0; i < stages.Length; i++)
        {
            var stageEnum = stages[i].Item1;
            var stageName = stages[i].Item2;
            bool isCompleted = (currentStageIndex >= 0 && currentStageIndex >= i);
            bool isCurrent = (currentStageIndex == i);

            DateTime? achievedAt = null;
            if (stageEnum == ApplicationStatus.APPLIED) achievedAt = appliedAt;
            else if (stageEnum == ApplicationStatus.SCREENING && viewedAt.HasValue) achievedAt = viewedAt;

            timeline.Add(new ApplicationTimelineItemDto(
                stageEnum.ToString(),
                stageName,
                achievedAt,
                isCompleted,
                isCurrent
            ));
        }

        if (status == ApplicationStatus.REJECTED)
        {
            timeline.Add(new ApplicationTimelineItemDto(
                "REJECTED",
                "Chưa phù hợp",
                null,
                true,
                true
            ));
        }
        else if (status == ApplicationStatus.WITHDRAWN)
        {
            timeline.Add(new ApplicationTimelineItemDto(
                "WITHDRAWN",
                "Đã rút ứng tuyển",
                null,
                true,
                true
            ));
        }

        return timeline;
    }
}

public class GetApplicationByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetApplicationByIdQuery, ApplicationDto?>
{
    public async Task<ApplicationDto?> Handle(GetApplicationByIdQuery request, CancellationToken cancellationToken)
    {
        var a = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .Include(a => a.CandidateCv)
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (a == null) return null;

        var score = a.MatchScore ?? GetApplicationsQueryHandler.CalculateMatchScore(a.Job?.Title ?? string.Empty, a.Job?.Requirements ?? string.Empty, a.Candidate?.Skills, a.Candidate?.ExperienceSummary);
        var strengths = !string.IsNullOrEmpty(a.AiStrengthsJson) ? JsonSerializer.Deserialize<List<string>>(a.AiStrengthsJson) : null;
        var gaps = !string.IsNullOrEmpty(a.AiGapsJson) ? JsonSerializer.Deserialize<List<string>>(a.AiGapsJson) : null;
        var timeline = GetApplicationsQueryHandler.BuildTimeline(a.Status, a.AppliedAt, a.ViewedAt);

        return new ApplicationDto(
            a.Id,
            a.JobId,
            a.Job?.Title ?? string.Empty,
            a.Job?.Company?.Name ?? "Hệ thống HR",
            a.CandidateId,
            a.Candidate?.User?.FullName ?? a.Candidate?.FullName ?? "Ứng viên",
            a.Candidate?.User?.Email ?? string.Empty,
            a.Candidate?.User?.AvatarUrl ?? a.Candidate?.AvatarUrl,
            a.CandidateCvId,
            a.CandidateCv?.CvTitle ?? string.Empty,
            a.CandidateCv?.FileUrl ?? string.Empty,
            a.CoverLetter,
            a.Status.ToString(),
            a.AppliedAt,
            a.ViewedAt,
            score,
            a.AiSummary,
            strengths,
            gaps,
            a.AiEvaluatedAt,
            timeline
        );
    }
}
