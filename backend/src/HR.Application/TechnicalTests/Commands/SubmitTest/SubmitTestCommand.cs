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
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.TechnicalTests.Commands.SubmitTest;

public record SubmitTestCommand(
    int TestId,
    List<SubmitAnswerItem> Answers
) : IRequest<ApiResponse<SubmitTestResultDto>>;

public class SubmitTestCommandHandler(
    IApplicationDbContext context,
    INotificationSender notificationSender,
    IEmailService emailService,
    ICurrentUserService currentUserService
) : IRequestHandler<SubmitTestCommand, ApiResponse<SubmitTestResultDto>>
{
    public async Task<ApiResponse<SubmitTestResultDto>> Handle(
        SubmitTestCommand request,
        CancellationToken cancellationToken)
    {
        var test = await context.TechnicalTests
            .Include(t => t.Application)
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .Include(t => t.Application)
                .ThenInclude(a => a.Candidate)
                    .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(t => t.Id == request.TestId, cancellationToken);

        if (test == null)
        {
            throw new NotFoundException("TEST_NOT_FOUND", "Không tìm thấy bài kiểm tra.");
        }

        if (test.Status == TechnicalTestStatus.PASSED || test.Status == TechnicalTestStatus.FAILED)
        {
            throw new BadRequestException("TEST_ALREADY_SUBMITTED", "Bài kiểm tra này đã được nộp và chấm điểm trước đó.");
        }

        var now = DateTime.Now;
        test.SubmittedAt = now;

        // Parse danh sách câu hỏi gốc từ đề thi
        var questions = new List<AssessmentQuestionDto>();
        try
        {
            if (!string.IsNullOrWhiteSpace(test.QuestionsData))
            {
                questions = JsonSerializer.Deserialize<List<AssessmentQuestionDto>>(test.QuestionsData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new();
            }
        }
        catch { }

        var totalQuestions = questions.Count > 0 ? questions.Count : (test.TotalQuestions > 0 ? test.TotalQuestions : 1);
        var answersMap = request.Answers?.ToDictionary(a => a.QuestionId, a => a.SelectedOptionIndex)
                         ?? new Dictionary<int, int>();

        int correctCount = 0;
        var submissionAuditList = new List<object>();

        foreach (var q in questions)
        {
            answersMap.TryGetValue(q.Id, out var selectedIndex);
            var isCorrect = selectedIndex == q.CorrectOptionIndex;
            if (isCorrect)
            {
                correctCount++;
            }

            submissionAuditList.Add(new
            {
                questionId = q.Id,
                question = q.Question,
                correctOptionIndex = q.CorrectOptionIndex,
                candidateSelectedIndex = selectedIndex,
                isCorrect = isCorrect,
                explanation = q.Explanation
            });
        }

        // Tính điểm phần trăm
        var calculatedScore = (int)Math.Round((double)correctCount * 100.0 / totalQuestions);
        var isPassed = calculatedScore >= test.PassingScore;

        test.TotalQuestions = totalQuestions;
        test.CorrectAnswersCount = correctCount;
        test.Score = calculatedScore;
        test.Status = isPassed ? TechnicalTestStatus.PASSED : TechnicalTestStatus.FAILED;
        test.AnswersData = JsonSerializer.Serialize(submissionAuditList);
        test.UpdatedAt = now;

        var candidateName = test.Application.Candidate.FullName;
        var candidateUserId = test.Application.Candidate.UserId > 0
            ? test.Application.Candidate.UserId
            : (test.Application.Candidate.User?.Id ?? 0);
        var candidateEmail = test.Application.Candidate.User?.Email ?? string.Empty;
        var jobTitle = test.Application.Job.Title;
        var companyName = test.Application.Job.Company.Name;
        var employerUserId = test.Application.Job.EmployerId;

        // Tìm User ID của Employer để gửi thông báo
        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.Id == test.Application.Job.EmployerId, cancellationToken);
        var employerNotifyUserId = employer?.UserId ?? 0;

        string resultMessage;

        if (isPassed)
        {
            // [YÊU CẦU CỐT LÕI]: Nếu đạt điểm chuẩn -> TỰ ĐỘNG CHUYỂN SANG SHORTLISTED VÀ GỢI Ý MỞ LỊCH PHỎNG VẤN
            test.Application.Status = ApplicationStatus.SHORTLISTED;
            test.Application.UpdatedAt = now;
            test.Notes = $"Tự động chuyển sang SHORTLISTED do đạt {calculatedScore}% (Điểm chuẩn: {test.PassingScore}%) bài kiểm tra {test.Title} lúc {now:HH:mm dd/MM/yyyy}.";

            resultMessage = $"Chúc mừng bạn đã xuất sắc vượt qua bài kiểm tra năng lực với {calculatedScore}% điểm (Điểm chuẩn: {test.PassingScore}%). Hồ sơ của bạn đã được tự động chuyển sang vòng Shortlisted!";

            // Thông báo tới Nhà tuyển dụng: Gợi ý mở lịch phỏng vấn
            if (employerNotifyUserId > 0)
            {
                await notificationSender.SendNotificationAsync(
                    employerNotifyUserId,
                    $"⭐ Ứng viên {candidateName} ĐẠT bài test ({calculatedScore}%) - Đã chuyển Shortlisted",
                    $"Ứng viên {candidateName} đã hoàn thành xuất sắc bài test cho vị trí '{jobTitle}' đạt {calculatedScore}% (Đúng {correctCount}/{totalQuestions} câu). Hệ thống đã tự động chuyển sang SHORTLISTED. Gợi ý: Hãy lên lịch phỏng vấn ngay!",
                    NotificationType.ASSESSMENT_RESULT,
                    "/employer/applications",
                    cancellationToken);
            }

            // Thông báo tới Ứng viên
            if (candidateUserId > 0)
            {
                await notificationSender.SendNotificationAsync(
                    candidateUserId,
                    $"🎉 Chúc mừng! Bạn đã ĐẠT bài test năng lực ({calculatedScore}%)",
                    $"Bạn đã đạt {calculatedScore}% bài kiểm tra vị trí {jobTitle} tại {companyName}. Hồ sơ đã được chuyển sang vòng Shortlisted, nhà tuyển dụng sẽ sớm liên hệ phỏng vấn!",
                    NotificationType.ASSESSMENT_RESULT,
                    "/candidate/applications",
                    cancellationToken);
            }
        }
        else
        {
            // Nếu không đạt: Đưa vào danh sách xem xét thêm
            test.Notes = $"Hoàn thành bài kiểm tra {test.Title}: {calculatedScore}% (Dưới điểm chuẩn {test.PassingScore}%). Đưa vào danh sách xem xét thêm lúc {now:HH:mm dd/MM/yyyy}.";
            resultMessage = $"Bạn đã hoàn thành bài kiểm tra với kết quả {calculatedScore}%. Kết quả đã được ghi nhận vào hồ sơ ứng tuyển để nhà tuyển dụng xem xét thêm.";

            // Thông báo tới Nhà tuyển dụng
            if (employerNotifyUserId > 0)
            {
                await notificationSender.SendNotificationAsync(
                    employerNotifyUserId,
                    $"📊 Ứng viên {candidateName} đã nộp bài test: {calculatedScore}%",
                    $"Ứng viên {candidateName} vị trí '{jobTitle}' đạt {calculatedScore}% (Điểm chuẩn {test.PassingScore}%). Hồ sơ đã được lưu để xem xét thêm.",
                    NotificationType.ASSESSMENT_RESULT,
                    "/employer/applications",
                    cancellationToken);
            }

            // Thông báo tới Ứng viên
            if (candidateUserId > 0)
            {
                await notificationSender.SendNotificationAsync(
                    candidateUserId,
                    $"📊 Đã ghi nhận kết quả bài test năng lực ({calculatedScore}%)",
                    $"Bạn đã hoàn thành bài test vị trí {jobTitle} tại {companyName}. Kết quả đã được chuyển tới nhà tuyển dụng để xem xét.",
                    NotificationType.ASSESSMENT_RESULT,
                    "/candidate/applications",
                    cancellationToken);
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        // Gửi email thông báo kết quả cho ứng viên
        if (!string.IsNullOrWhiteSpace(candidateEmail))
        {
            _ = emailService.SendAssessmentResultEmailAsync(
                candidateEmail,
                candidateName,
                jobTitle,
                companyName,
                test.Title,
                calculatedScore,
                test.PassingScore,
                isPassed,
                cancellationToken);
        }

        return ApiResponse<SubmitTestResultDto>.Ok(new SubmitTestResultDto
        {
            TestId = test.Id,
            ApplicationId = test.ApplicationId,
            Title = test.Title,
            Score = calculatedScore,
            TotalQuestions = totalQuestions,
            CorrectCount = correctCount,
            PassingScore = test.PassingScore,
            IsPassed = isPassed,
            Status = test.Status.ToString(),
            ApplicationStatus = test.Application.Status.ToString(),
            Message = resultMessage,
            SubmittedAt = now
        });
    }
}
