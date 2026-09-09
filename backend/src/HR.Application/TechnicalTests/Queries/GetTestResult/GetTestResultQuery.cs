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

namespace HR.Application.TechnicalTests.Queries.GetTestResult;

public record GetTestResultQuery(int TestId) : IRequest<ApiResponse<TestDetailResultDto>>;

public class GetTestResultQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService
) : IRequestHandler<GetTestResultQuery, ApiResponse<TestDetailResultDto>>
{
    public async Task<ApiResponse<TestDetailResultDto>> Handle(
        GetTestResultQuery request,
        CancellationToken cancellationToken)
    {
        var test = await context.TechnicalTests
            .Include(t => t.Application)
                .ThenInclude(a => a.Job)
            .Include(t => t.Application)
                .ThenInclude(a => a.Candidate)
                    .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(t => t.Id == request.TestId, cancellationToken);

        if (test == null)
        {
            throw new NotFoundException("TEST_NOT_FOUND", "Không tìm thấy bài kiểm tra.");
        }

        var reviews = new List<AssessmentQuestionReviewDto>();

        // Parse audit submission list nếu có
        if (!string.IsNullOrWhiteSpace(test.AnswersData))
        {
            try
            {
                using var doc = JsonDocument.Parse(test.AnswersData);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.Array)
                {
                    // Lấy lại danh sách options từ QuestionsData
                    var questions = new Dictionary<int, List<string>>();
                    if (!string.IsNullOrWhiteSpace(test.QuestionsData))
                    {
                        var qList = JsonSerializer.Deserialize<List<AssessmentQuestionDto>>(test.QuestionsData, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                        if (qList != null)
                        {
                            foreach (var q in qList)
                            {
                                questions[q.Id] = q.Options;
                            }
                        }
                    }

                    foreach (var item in root.EnumerateArray())
                    {
                        var qId = item.GetProperty("questionId").GetInt32();
                        var qText = item.GetProperty("question").GetString() ?? string.Empty;
                        var correctIdx = item.GetProperty("correctOptionIndex").GetInt32();
                        var selectedIdx = item.GetProperty("candidateSelectedIndex").GetInt32();
                        var isCorr = item.GetProperty("isCorrect").GetBoolean();
                        var expl = item.TryGetProperty("explanation", out var expProp) ? expProp.GetString() : null;

                        questions.TryGetValue(qId, out var opts);

                        reviews.Add(new AssessmentQuestionReviewDto
                        {
                            Id = qId,
                            Question = qText,
                            Options = opts ?? new List<string>(),
                            CorrectOptionIndex = correctIdx,
                            CandidateSelectedOptionIndex = selectedIdx,
                            IsCorrect = isCorr,
                            Explanation = expl
                        });
                    }
                }
            }
            catch { }
        }

        var dto = new TestDetailResultDto
        {
            TestId = test.Id,
            ApplicationId = test.ApplicationId,
            CandidateName = test.Application.Candidate.FullName,
            CandidateEmail = test.Application.Candidate.User?.Email ?? string.Empty,
            JobTitle = test.Application.Job.Title,
            Title = test.Title,
            TestType = test.TestType.ToString(),
            DurationMinutes = test.DurationMinutes,
            PassingScore = test.PassingScore,
            Score = test.Score,
            TotalQuestions = test.TotalQuestions,
            CorrectAnswersCount = test.CorrectAnswersCount,
            Status = test.Status.ToString(),
            StartTime = test.StartTime,
            SubmittedAt = test.SubmittedAt,
            QuestionReviews = reviews
        };

        return ApiResponse<TestDetailResultDto>.Ok(dto);
    }
}
