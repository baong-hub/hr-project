using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.TechnicalTests.Models;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.TechnicalTests.Commands.SaveAssessmentTemplate;

public record SaveAssessmentTemplateCommand(
    int JobId,
    string Title,
    string? Description,
    string TestType,
    int DurationMinutes,
    int PassingScore,
    int TotalQuestions,
    bool AutoInviteOnApply,
    bool AutoInviteOnScreening,
    List<AssessmentQuestionDto> Questions
) : IRequest<ApiResponse<AssessmentTemplateDto>>;

public class SaveAssessmentTemplateCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService
) : IRequestHandler<SaveAssessmentTemplateCommand, ApiResponse<AssessmentTemplateDto>>
{
    public async Task<ApiResponse<AssessmentTemplateDto>> Handle(
        SaveAssessmentTemplateCommand request,
        CancellationToken cancellationToken)
    {
        var job = await context.Jobs
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == request.JobId, cancellationToken);

        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Tin tuyển dụng không tồn tại.");
        }

        var userId = currentUserService.UserId;
        var employer = await context.Employers.FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
        var isAdmin = currentUserService.Username == "admin";

        if (!isAdmin && (employer == null || job.CompanyId != employer.CompanyId))
        {
            throw new ForbiddenException("Bạn không có quyền quản trị bài kiểm tra cho tin tuyển dụng này.");
        }

        if (!Enum.TryParse<TechnicalTestType>(request.TestType, true, out var parsedType))
        {
            parsedType = TechnicalTestType.TECHNICAL;
        }

        var template = await context.JobAssessmentTemplates
            .FirstOrDefaultAsync(t => t.JobId == request.JobId, cancellationToken);

        var questionsJson = JsonSerializer.Serialize(request.Questions ?? new List<AssessmentQuestionDto>());
        var totalQ = request.Questions?.Count ?? request.TotalQuestions;

        if (template == null)
        {
            template = new JobAssessmentTemplate
            {
                JobId = request.JobId,
                Title = string.IsNullOrWhiteSpace(request.Title) ? $"Đánh Giá Năng Lực - {job.Title}" : request.Title,
                Description = request.Description,
                TestType = parsedType,
                DurationMinutes = request.DurationMinutes > 0 ? request.DurationMinutes : 30,
                PassingScore = request.PassingScore > 0 ? request.PassingScore : 70,
                TotalQuestions = totalQ > 0 ? totalQ : 10,
                QuestionsData = questionsJson,
                AutoInviteOnApply = request.AutoInviteOnApply,
                AutoInviteOnScreening = request.AutoInviteOnScreening,
                IsActive = true,
                CreatedAt = DateTime.Now,
                CreatedBy = userId,
                UpdatedAt = DateTime.Now
            };

            context.JobAssessmentTemplates.Add(template);
        }
        else
        {
            template.Title = string.IsNullOrWhiteSpace(request.Title) ? template.Title : request.Title;
            template.Description = request.Description;
            template.TestType = parsedType;
            template.DurationMinutes = request.DurationMinutes > 0 ? request.DurationMinutes : 30;
            template.PassingScore = request.PassingScore > 0 ? request.PassingScore : 70;
            template.TotalQuestions = totalQ > 0 ? totalQ : template.TotalQuestions;
            template.QuestionsData = questionsJson;
            template.AutoInviteOnApply = request.AutoInviteOnApply;
            template.AutoInviteOnScreening = request.AutoInviteOnScreening;
            template.UpdatedAt = DateTime.Now;
            template.UpdatedBy = userId;
        }

        await context.SaveChangesAsync(cancellationToken);

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
            Questions = request.Questions ?? new()
        };

        return ApiResponse<AssessmentTemplateDto>.Ok(dto);
    }
}
