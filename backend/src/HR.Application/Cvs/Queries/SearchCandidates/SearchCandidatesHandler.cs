using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Cvs.Dtos;
using HR.Domain.Entities;
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
            .Include(c => c.User)
            .Include(c => c.Experiences)
            .Include(c => c.CandidateCvs)
            .Include(c => c.CandidateSkills)
                .ThenInclude(cs => cs.Skill)
            .AsNoTracking();

        // 1. Chỉ hiển thị ứng viên có visibilityStatus = PUBLIC
        query = query.Where(c => c.VisibilityStatus == CandidateVisibilityStatus.PUBLIC);

        // 2. Lọc theo search (Tên, Mục tiêu nghề nghiệp, Tóm tắt kinh nghiệm)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchKw = request.Search.Trim().ToLower();
            query = query.Where(c => 
                c.FullName.ToLower().Contains(searchKw) || 
                (c.Objective != null && c.Objective.ToLower().Contains(searchKw)) ||
                (c.ExperienceSummary != null && c.ExperienceSummary.ToLower().Contains(searchKw)) ||
                (c.Skills != null && c.Skills.ToLower().Contains(searchKw)) ||
                c.Experiences.Any(e => e.Position.ToLower().Contains(searchKw) || e.CompanyName.ToLower().Contains(searchKw))
            );
        }

        // 3. Lọc theo skill (Hỗ trợ nhiều skill phân tách bằng dấu phẩy)
        if (!string.IsNullOrWhiteSpace(request.Skill))
        {
            var skillTokens = request.Skill.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => s.ToLower())
                .ToList();

            foreach (var token in skillTokens)
            {
                var t = token;
                query = query.Where(c => 
                    c.CandidateSkills.Any(cs => cs.Skill.SkillName.ToLower().Contains(t)) ||
                    (c.Skills != null && c.Skills.ToLower().Contains(t))
                );
            }
        }

        // 4. Lọc theo địa điểm (Location / Address) linh hoạt theo aliases
        if (!string.IsNullOrWhiteSpace(request.Location))
        {
            var rawLoc = request.Location.Trim().ToLower();
            if (rawLoc == "hcm" || rawLoc.Contains("hồ chí minh") || rawLoc.Contains("ho chi minh") || rawLoc.Contains("sài gòn") || rawLoc.Contains("saigon") || rawLoc == "tp. hcm" || rawLoc == "tp.hcm")
            {
                query = query.Where(c => 
                    (c.User != null && c.User.Address != null && (
                        c.User.Address.ToLower().Contains("hcm") || 
                        c.User.Address.ToLower().Contains("hồ chí minh") || 
                        c.User.Address.ToLower().Contains("ho chi minh") || 
                        c.User.Address.ToLower().Contains("sài gòn"))) ||
                    (c.Objective != null && (
                        c.Objective.ToLower().Contains("hcm") || 
                        c.Objective.ToLower().Contains("hồ chí minh") || 
                        c.Objective.ToLower().Contains("ho chi minh") || 
                        c.Objective.ToLower().Contains("sài gòn"))) ||
                    (c.ExperienceSummary != null && (
                        c.ExperienceSummary.ToLower().Contains("hcm") || 
                        c.ExperienceSummary.ToLower().Contains("hồ chí minh") || 
                        c.ExperienceSummary.ToLower().Contains("ho chi minh") || 
                        c.ExperienceSummary.ToLower().Contains("sài gòn")))
                );
            }
            else if (rawLoc == "hanoi" || rawLoc.Contains("hà nội") || rawLoc.Contains("ha noi") || rawLoc == "hn")
            {
                query = query.Where(c => 
                    (c.User != null && c.User.Address != null && (
                        c.User.Address.ToLower().Contains("hà nội") || 
                        c.User.Address.ToLower().Contains("ha noi") || 
                        c.User.Address.ToLower().Contains("hanoi") || 
                        c.User.Address.ToLower().Contains("hn"))) ||
                    (c.Objective != null && (
                        c.Objective.ToLower().Contains("hà nội") || 
                        c.Objective.ToLower().Contains("ha noi") || 
                        c.Objective.ToLower().Contains("hanoi") || 
                        c.Objective.ToLower().Contains("hn"))) ||
                    (c.ExperienceSummary != null && (
                        c.ExperienceSummary.ToLower().Contains("hà nội") || 
                        c.ExperienceSummary.ToLower().Contains("ha noi") || 
                        c.ExperienceSummary.ToLower().Contains("hanoi") || 
                        c.ExperienceSummary.ToLower().Contains("hn")))
                );
            }
            else if (rawLoc == "danang" || rawLoc.Contains("đà nẵng") || rawLoc.Contains("da nang") || rawLoc == "dn")
            {
                query = query.Where(c => 
                    (c.User != null && c.User.Address != null && (
                        c.User.Address.ToLower().Contains("đà nẵng") || 
                        c.User.Address.ToLower().Contains("da nang") || 
                        c.User.Address.ToLower().Contains("danang") || 
                        c.User.Address.ToLower().Contains("dn"))) ||
                    (c.Objective != null && (
                        c.Objective.ToLower().Contains("đà nẵng") || 
                        c.Objective.ToLower().Contains("da nang") || 
                        c.Objective.ToLower().Contains("danang") || 
                        c.Objective.ToLower().Contains("dn"))) ||
                    (c.ExperienceSummary != null && (
                        c.ExperienceSummary.ToLower().Contains("đà nẵng") || 
                        c.ExperienceSummary.ToLower().Contains("da nang") || 
                        c.ExperienceSummary.ToLower().Contains("danang") || 
                        c.ExperienceSummary.ToLower().Contains("dn")))
                );
            }
            else
            {
                query = query.Where(c => 
                    (c.User != null && c.User.Address != null && c.User.Address.ToLower().Contains(rawLoc)) ||
                    (c.Objective != null && c.Objective.ToLower().Contains(rawLoc)) ||
                    (c.ExperienceSummary != null && c.ExperienceSummary.ToLower().Contains(rawLoc))
                );
            }
        }

        // 5. Tải dữ liệu về bộ nhớ để tính toán tổng số năm kinh nghiệm và cấp bậc chính xác
        var candidatesList = await query.ToListAsync(cancellationToken);

        // 6. Tính toán năm kinh nghiệm và lọc theo cấp bậc / số năm
        var processed = candidatesList.Select(c =>
        {
            int totalMonths = 0;
            foreach (var exp in c.Experiences)
            {
                var end = exp.EndDate ?? DateTime.Now;
                if (end > exp.StartDate)
                {
                    totalMonths += (int)((end.Year - exp.StartDate.Year) * 12 + end.Month - exp.StartDate.Month);
                }
            }
            int totalYears = totalMonths > 0 ? (int)Math.Round((double)totalMonths / 12) : 0;

            // Nếu không có bảng Experiences chi tiết nhưng có trường ExperienceSummary, ước lượng số năm
            if (totalYears == 0 && !string.IsNullOrWhiteSpace(c.ExperienceSummary))
            {
                var summary = c.ExperienceSummary.ToLower();
                if (summary.Contains("1 năm") || summary.Contains("1 year")) totalYears = 1;
                else if (summary.Contains("2 năm") || summary.Contains("2 years") || summary.Contains("2+")) totalYears = 2;
                else if (summary.Contains("3 năm") || summary.Contains("3 years") || summary.Contains("3+")) totalYears = 3;
                else if (summary.Contains("4 năm") || summary.Contains("4 years")) totalYears = 4;
                else if (summary.Contains("5 năm") || summary.Contains("5 years") || summary.Contains("5+")) totalYears = 5;
                else if (summary.Contains("senior") || summary.Contains("lead")) totalYears = 5;
            }

            var latestExp = c.Experiences.OrderByDescending(e => e.EndDate ?? DateTime.MaxValue).ThenByDescending(e => e.StartDate).FirstOrDefault();
            var defaultCv = c.CandidateCvs.FirstOrDefault(cv => cv.IsDefault) ?? c.CandidateCvs.OrderByDescending(cv => cv.Id).FirstOrDefault();

            var skills = c.CandidateSkills.Select(cs => cs.Skill.SkillName).Distinct().ToList();
            if (!string.IsNullOrWhiteSpace(c.Skills))
            {
                var rawSkills = c.Skills.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (var s in rawSkills)
                {
                    if (!skills.Contains(s, StringComparer.OrdinalIgnoreCase))
                        skills.Add(s);
                }
            }

            return new
            {
                Candidate = c,
                TotalYears = totalYears,
                LatestExp = latestExp,
                DefaultCv = defaultCv,
                Skills = skills
            };
        });

        // Áp dụng bộ lọc Min/Max năm kinh nghiệm
        if (request.MinYearsExp.HasValue)
        {
            processed = processed.Where(x => x.TotalYears >= request.MinYearsExp.Value);
        }

        if (request.MaxYearsExp.HasValue)
        {
            processed = processed.Where(x => x.TotalYears <= request.MaxYearsExp.Value);
        }

        // Áp dụng bộ lọc Level (Junior, Mid, Senior, Lead)
        if (!string.IsNullOrWhiteSpace(request.Level))
        {
            var level = request.Level.Trim().ToLower();
            if (level.Contains("junior") || level.Contains("fresher"))
            {
                processed = processed.Where(x => x.TotalYears <= 2);
            }
            else if (level.Contains("mid"))
            {
                processed = processed.Where(x => x.TotalYears >= 2 && x.TotalYears <= 4);
            }
            else if (level.Contains("senior"))
            {
                processed = processed.Where(x => x.TotalYears >= 5 && x.TotalYears <= 8);
            }
            else if (level.Contains("lead") || level.Contains("manager"))
            {
                processed = processed.Where(x => x.TotalYears >= 8);
            }
        }

        // 7. Phân trang
        var pagedResults = processed
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        return pagedResults.Select(x => new CandidateProfileDto(
            x.Candidate.Id,
            string.IsNullOrWhiteSpace(x.Candidate.FullName) ? (x.Candidate.User?.FullName ?? "Ứng viên") : x.Candidate.FullName,
            x.Candidate.AvatarUrl ?? x.Candidate.User?.AvatarUrl,
            x.Candidate.Gender?.ToString(),
            x.Candidate.BirthDate,
            x.Candidate.Objective,
            x.Skills,
            x.Candidate.VisibilityStatus.ToString(),
            x.Candidate.ExperienceSummary,
            x.LatestExp?.Position,
            x.LatestExp?.CompanyName,
            x.TotalYears,
            x.Candidate.User?.Address,
            x.DefaultCv?.FileUrl,
            x.DefaultCv?.CvTitle,
            x.Candidate.User?.Email,
            x.Candidate.User?.PhoneNumber ?? x.Candidate.User?.Phone
        )).ToList();
    }
}
