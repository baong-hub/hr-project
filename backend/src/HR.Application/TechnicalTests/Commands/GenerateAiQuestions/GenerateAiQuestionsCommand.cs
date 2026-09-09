using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.TechnicalTests.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.TechnicalTests.Commands.GenerateAiQuestions;

public record GenerateAiQuestionsCommand(
    int JobId,
    string TestType,
    int TotalQuestions
) : IRequest<ApiResponse<List<AssessmentQuestionDto>>>;

public class GenerateAiQuestionsCommandHandler(
    IApplicationDbContext context,
    IAiService aiService,
    ICurrentUserService currentUserService
) : IRequestHandler<GenerateAiQuestionsCommand, ApiResponse<List<AssessmentQuestionDto>>>
{
    public async Task<ApiResponse<List<AssessmentQuestionDto>>> Handle(
        GenerateAiQuestionsCommand request,
        CancellationToken cancellationToken)
    {
        var job = await context.Jobs.FirstOrDefaultAsync(j => j.Id == request.JobId, cancellationToken);
        if (job == null)
        {
            throw new NotFoundException("JOB_NOT_FOUND", "Tin tuyển dụng không tồn tại.");
        }

        var count = Math.Clamp(request.TotalQuestions > 0 ? request.TotalQuestions : 10, 5, 25);
        var type = string.IsNullOrWhiteSpace(request.TestType) ? "TECHNICAL" : request.TestType;

        var aiQuestions = await aiService.GenerateAssessmentQuestionsAsync(request.JobId, type, count, cancellationToken);

        var dtoList = aiQuestions.Select((q, idx) => new AssessmentQuestionDto
        {
            Id = idx + 1,
            Question = q.Question,
            Options = q.Options,
            CorrectOptionIndex = q.CorrectOptionIndex,
            Explanation = q.Explanation,
            Category = q.Category ?? type,
            Difficulty = q.Difficulty
        }).ToList();

        return ApiResponse<List<AssessmentQuestionDto>>.Ok(dtoList);
    }
}
