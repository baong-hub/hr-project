using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Applications.Commands.EvaluateApplicationAi;

public record EvaluateApplicationAiCommand(int ApplicationId) : IRequest<ApplicationDto>;

public class EvaluateApplicationAiCommandHandler(
    IApplicationDbContext context,
    IAiService aiService) : IRequestHandler<EvaluateApplicationAiCommand, ApplicationDto>
{
    public async Task<ApplicationDto> Handle(EvaluateApplicationAiCommand request, CancellationToken cancellationToken)
    {
        var application = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .Include(a => a.CandidateCv)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (application == null)
        {
            throw new NotFoundException("APPLICATION_NOT_FOUND", "Không tìm thấy hồ sơ ứng tuyển.");
        }

        // Gọi AI Service để phân tích CV ứng viên so với Job Description
        var fitResult = await aiService.AnalyzeJobFitAsync(application.CandidateId, application.JobId, cancellationToken);

        application.MatchScore = fitResult.MatchScore;
        application.AiSummary = fitResult.Summary;
        application.AiStrengthsJson = JsonSerializer.Serialize(fitResult.Strengths ?? new List<string>());
        application.AiGapsJson = JsonSerializer.Serialize(fitResult.MissingSkills ?? new List<string>());
        application.AiEvaluatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        var timeline = GetApplicationsQueryHandler.BuildTimeline(application.Status, application.AppliedAt, application.ViewedAt);

        return new ApplicationDto(
            application.Id,
            application.JobId,
            application.Job?.Title ?? string.Empty,
            application.Job?.Company?.Name ?? "Hệ thống HR",
            application.CandidateId,
            application.Candidate?.User?.FullName ?? application.Candidate?.FullName ?? "Ứng viên",
            application.Candidate?.User?.Email ?? string.Empty,
            application.Candidate?.User?.AvatarUrl ?? application.Candidate?.AvatarUrl,
            application.CandidateCvId,
            application.CandidateCv?.CvTitle ?? string.Empty,
            application.CandidateCv?.FileUrl ?? string.Empty,
            application.CoverLetter,
            application.Status.ToString(),
            application.AppliedAt,
            application.ViewedAt,
            application.MatchScore,
            application.AiSummary,
            fitResult.Strengths,
            fitResult.MissingSkills,
            application.AiEvaluatedAt,
            timeline
        );
    }
}
