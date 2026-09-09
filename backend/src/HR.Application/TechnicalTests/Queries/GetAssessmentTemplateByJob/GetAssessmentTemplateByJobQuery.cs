using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.TechnicalTests.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.TechnicalTests.Queries.GetAssessmentTemplateByJob;

public record GetAssessmentTemplateByJobQuery(int JobId) : IRequest<ApiResponse<AssessmentTemplateDto?>>;

public class GetAssessmentTemplateByJobQueryHandler(
    IApplicationDbContext context
) : IRequestHandler<GetAssessmentTemplateByJobQuery, ApiResponse<AssessmentTemplateDto?>>
{
    public async Task<ApiResponse<AssessmentTemplateDto?>> Handle(
        GetAssessmentTemplateByJobQuery request,
        CancellationToken cancellationToken)
    {
        var job = await context.Jobs.FirstOrDefaultAsync(j => j.Id == request.JobId, cancellationToken);
        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Tin tuyển dụng không tồn tại.");
        }

        var template = await context.JobAssessmentTemplates
            .FirstOrDefaultAsync(t => t.JobId == request.JobId && t.IsActive, cancellationToken);

        if (template == null)
        {
            return ApiResponse<AssessmentTemplateDto?>.Ok(null);
        }

        var questions = new List<AssessmentQuestionDto>();
        try
        {
            if (!string.IsNullOrWhiteSpace(template.QuestionsData))
            {
                questions = JsonSerializer.Deserialize<List<AssessmentQuestionDto>>(template.QuestionsData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new();
            }
        }
        catch { }

        var dto = new AssessmentTemplateDto
        {
            Id = template.Id,
            JobId = template.JobId,
            JobTitle = job.Title,
            Title = template.Title,
            Description = template.Description,
            TestType = template.TestType.ToString(),
            DurationMinutes = template.DurationMinutes,
            PassingScore = template.PassingScore,
            TotalQuestions = template.TotalQuestions,
            AutoInviteOnApply = template.AutoInviteOnApply,
            AutoInviteOnScreening = template.AutoInviteOnScreening,
            IsActive = template.IsActive,
            Questions = questions
        };

        return ApiResponse<AssessmentTemplateDto?>.Ok(dto);
    }
}
