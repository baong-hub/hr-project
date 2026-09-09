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

namespace HR.Application.TechnicalTests.Commands.InviteCandidateTest;

public record InviteCandidateTestCommand(
    int ApplicationId,
    int? DurationMinutes = null,
    int? PassingScore = null
) : IRequest<ApiResponse<TechnicalTestSummaryDto>>;

public class InviteCandidateTestCommandHandler(
    IApplicationDbContext context,
    INotificationSender notificationSender,
    IEmailService emailService,
    ICurrentUserService currentUserService
) : IRequestHandler<InviteCandidateTestCommand, ApiResponse<TechnicalTestSummaryDto>>
{
    public async Task<ApiResponse<TechnicalTestSummaryDto>> Handle(
        InviteCandidateTestCommand request,
        CancellationToken cancellationToken)
    {
        var app = await context.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (app == null)
        {
            throw new NotFoundException("APPLICATION_NOT_FOUND", "Không tìm thấy hồ sơ ứng tuyển.");
        }

        // Tìm đề thi mẫu của Job
        var template = await context.JobAssessmentTemplates
            .FirstOrDefaultAsync(t => t.JobId == app.JobId && t.IsActive, cancellationToken);

        var duration = request.DurationMinutes ?? (template?.DurationMinutes ?? 30);
        var passingScore = request.PassingScore ?? (template?.PassingScore ?? 70);
        var testType = template?.TestType ?? TechnicalTestType.TECHNICAL;
        var title = template != null ? template.Title : $"Bài Test Năng Lực - {app.Job.Title}";
        var questionsJson = template?.QuestionsData ?? "[]";
        var totalQuestions = template?.TotalQuestions ?? 10;

        // Nếu template chưa có câu hỏi, sinh câu hỏi mẫu mặc định
        if (string.IsNullOrWhiteSpace(questionsJson) || questionsJson == "[]")
        {
            var defaultQuestions = new List<AssessmentQuestionDto>
            {
                new()
                {
                    Id = 1,
                    Question = $"Kỹ thuật nào sau đây quan trọng nhất khi phát triển phần mềm cho vị trí {app.Job.Title}?",
                    Options = new() { "Thiết kế kiến trúc sạch (Clean Architecture) và viết mã có thể kiểm thử", "Bỏ qua viết unit test để bàn giao nhanh", "Viết toàn bộ code trong một file duy nhất", "Lưu mật khẩu dạng plain-text" },
                    CorrectOptionIndex = 0,
                    Explanation = "Clean Architecture giúp code dễ bảo trì, mở rộng và kiểm thử độc lập.",
                    Category = "Chuyên môn",
                    Difficulty = "Medium"
                },
                new()
                {
                    Id = 2,
                    Question = "Khi gặp sự cố hiệu năng cao tại môi trường Production, bước đầu tiên nên làm là gì?",
                    Options = new() { "Đo lường, phân tích log, APM và xác định đúng nút thắt (bottleneck)", "Khởi động lại toàn bộ máy chủ và xóa sạch database", "Đổ lỗi cho lập trình viên khác", "Tắt toàn bộ hệ thống trong 24 giờ" },
                    CorrectOptionIndex = 0,
                    Explanation = "Cần tiếp cận dựa trên dữ liệu và đo lường trước khi đưa ra hành động khắc phục.",
                    Category = "Xử lý sự cố",
                    Difficulty = "Medium"
                }
            };
            questionsJson = JsonSerializer.Serialize(defaultQuestions);
            totalQuestions = defaultQuestions.Count;
        }
        else
        {
            try
            {
                var parsedList = JsonSerializer.Deserialize<List<AssessmentQuestionDto>>(questionsJson);
                if (parsedList != null && parsedList.Count > 0)
                {
                    totalQuestions = parsedList.Count;
                }
            }
            catch { }
        }

        // Kiểm tra xem đã có bản ghi TechnicalTest chưa
        var existingTest = await context.TechnicalTests
            .FirstOrDefaultAsync(t => t.ApplicationId == app.Id, cancellationToken);

        if (existingTest == null)
        {
            existingTest = new TechnicalTest
            {
                ApplicationId = app.Id,
                Title = title,
                TestType = testType,
                DurationMinutes = duration,
                PassingScore = passingScore,
                TotalQuestions = totalQuestions,
                CorrectAnswersCount = 0,
                Score = 0,
                Status = TechnicalTestStatus.PENDING,
                QuestionsData = questionsJson,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            context.TechnicalTests.Add(existingTest);
        }
        else
        {
            // Reset lại để ứng viên làm bài mới
            existingTest.Title = title;
            existingTest.TestType = testType;
            existingTest.DurationMinutes = duration;
            existingTest.PassingScore = passingScore;
            existingTest.TotalQuestions = totalQuestions;
            existingTest.CorrectAnswersCount = 0;
            existingTest.Score = 0;
            existingTest.Status = TechnicalTestStatus.PENDING;
            existingTest.QuestionsData = questionsJson;
            existingTest.AnswersData = null;
            existingTest.StartTime = null;
            existingTest.SubmittedAt = null;
            existingTest.UpdatedAt = DateTime.Now;
        }

        await context.SaveChangesAsync(cancellationToken);

        // Gửi Notification và Email cho ứng viên
        var candidateUserId = app.Candidate.UserId > 0 ? app.Candidate.UserId : (app.Candidate.User?.Id ?? 0);
        var candidateEmail = app.Candidate.User?.Email ?? string.Empty;
        var candidateName = app.Candidate.FullName;
        var jobTitle = app.Job.Title;
        var companyName = app.Job.Company.Name;

        if (candidateUserId > 0)
        {
            await notificationSender.SendNotificationAsync(
                candidateUserId,
                $"📝 Mời bạn làm bài kiểm tra năng lực ({title})",
                $"Công ty {companyName} trân trọng mời bạn thực hiện bài kiểm tra năng lực ({duration} phút) cho vị trí {jobTitle}. Bấm để bắt đầu làm bài.",
                NotificationType.ASSESSMENT_INVITE,
                $"/candidate/assessment/{existingTest.Id}",
                cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(candidateEmail))
        {
            _ = emailService.SendAssessmentInvitationAsync(
                candidateEmail,
                candidateName,
                jobTitle,
                companyName,
                title,
                testType.ToString(),
                duration,
                passingScore,
                existingTest.Id,
                cancellationToken);
        }

        var dto = new TechnicalTestSummaryDto
        {
            Id = existingTest.Id,
            ApplicationId = app.Id,
            CandidateId = app.CandidateId,
            CandidateName = candidateName,
            CandidateEmail = candidateEmail,
            JobId = app.JobId,
            JobTitle = jobTitle,
            Title = existingTest.Title,
            TestType = existingTest.TestType.ToString(),
            DurationMinutes = existingTest.DurationMinutes,
            PassingScore = existingTest.PassingScore,
            TotalQuestions = existingTest.TotalQuestions,
            CorrectAnswersCount = existingTest.CorrectAnswersCount,
            Score = existingTest.Score,
            Status = existingTest.Status.ToString(),
            StartTime = existingTest.StartTime,
            SubmittedAt = existingTest.SubmittedAt,
            Notes = existingTest.Notes,
            CreatedAt = existingTest.CreatedAt
        };

        return ApiResponse<TechnicalTestSummaryDto>.Ok(dto);
    }
}
