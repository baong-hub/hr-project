using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.TechnicalTests.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.TechnicalTests.Queries.GetTestForCandidate;

public record GetTestForCandidateQuery(int TestId) : IRequest<ApiResponse<CandidateTestViewDto>>;

public class GetTestForCandidateQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService
) : IRequestHandler<GetTestForCandidateQuery, ApiResponse<CandidateTestViewDto>>
{
    public async Task<ApiResponse<CandidateTestViewDto>> Handle(
        GetTestForCandidateQuery request,
        CancellationToken cancellationToken)
    {
        var test = await context.TechnicalTests
            .Include(t => t.Application)
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .Include(t => t.Application)
                .ThenInclude(a => a.Candidate)
            .FirstOrDefaultAsync(t => t.Id == request.TestId, cancellationToken);

        if (test == null)
        {
            throw new NotFoundException("TEST_NOT_FOUND", "Không tìm thấy bài kiểm tra này.");
        }

        var candidateQuestions = new List<CandidateQuestionDto>();
        try
        {
            if (!string.IsNullOrWhiteSpace(test.QuestionsData))
            {
                var fullQuestions = JsonSerializer.Deserialize<List<AssessmentQuestionDto>>(test.QuestionsData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new();

                // Lọc bỏ CorrectOptionIndex và Explanation để ứng viên không thể gian lận
                candidateQuestions = fullQuestions.Select(q => new CandidateQuestionDto
                {
                    Id = q.Id,
                    Question = q.Question,
                    Options = q.Options,
                    Category = q.Category,
                    Difficulty = q.Difficulty
                }).ToList();
            }
        }
        catch { }

        var dto = new CandidateTestViewDto
        {
            TestId = test.Id,
            ApplicationId = test.ApplicationId,
            JobTitle = test.Application.Job.Title,
            CompanyName = test.Application.Job.Company.Name,
            Title = test.Title,
            TestType = test.TestType.ToString(),
            DurationMinutes = test.DurationMinutes,
            PassingScore = test.PassingScore,
            TotalQuestions = candidateQuestions.Count > 0 ? candidateQuestions.Count : test.TotalQuestions,
            Status = test.Status.ToString(),
            StartTime = test.StartTime,
            ServerCurrentTime = DateTime.Now,
            Questions = candidateQuestions
        };

        return ApiResponse<CandidateTestViewDto>.Ok(dto);
    }
}
