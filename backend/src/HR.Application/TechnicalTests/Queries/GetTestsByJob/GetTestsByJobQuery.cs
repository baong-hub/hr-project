using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.TechnicalTests.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.TechnicalTests.Queries.GetTestsByJob;

public record GetTestsByJobQuery(int JobId) : IRequest<ApiResponse<List<TechnicalTestSummaryDto>>>;

public class GetTestsByJobQueryHandler(
    IApplicationDbContext context
) : IRequestHandler<GetTestsByJobQuery, ApiResponse<List<TechnicalTestSummaryDto>>>
{
    public async Task<ApiResponse<List<TechnicalTestSummaryDto>>> Handle(
        GetTestsByJobQuery request,
        CancellationToken cancellationToken)
    {
        var tests = await context.TechnicalTests
            .Include(t => t.Application)
                .ThenInclude(a => a.Job)
            .Include(t => t.Application)
                .ThenInclude(a => a.Candidate)
                    .ThenInclude(c => c.User)
            .Where(t => t.Application.JobId == request.JobId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        var list = tests.Select(t => new TechnicalTestSummaryDto
        {
            Id = t.Id,
            ApplicationId = t.ApplicationId,
            CandidateId = t.Application.CandidateId,
            CandidateName = t.Application.Candidate.FullName,
            CandidateEmail = t.Application.Candidate.User?.Email ?? string.Empty,
            JobId = t.Application.JobId,
            JobTitle = t.Application.Job.Title,
            Title = t.Title,
            TestType = t.TestType.ToString(),
            DurationMinutes = t.DurationMinutes,
            PassingScore = t.PassingScore,
            TotalQuestions = t.TotalQuestions,
            CorrectAnswersCount = t.CorrectAnswersCount,
            Score = t.Score,
            Status = t.Status.ToString(),
            StartTime = t.StartTime,
            SubmittedAt = t.SubmittedAt,
            Notes = t.Notes,
            CreatedAt = t.CreatedAt
        }).ToList();

        return ApiResponse<List<TechnicalTestSummaryDto>>.Ok(list);
    }
}
