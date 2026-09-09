using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/ai")]
[Authorize]
public class AiController(
    IAiService aiService,
    ICurrentUserService currentUserService) : ControllerBase
{
    public class AnalyzeJobFitRequest
    {
        public int JobId { get; set; }
    }

    public class GenerateJdRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Keywords { get; set; }
    }

    public class AiChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public int? JobId { get; set; }
    }

    public class GenerateInterviewQuestionsRequest
    {
        public int JobId { get; set; }
        public int CandidateId { get; set; }
    }

    /// <summary>
    /// Phân tích mức độ phù hợp giữa CV của ứng viên đang đăng nhập và một công việc cụ thể
    /// </summary>
    [HttpPost("analyze-job-fit")]
    public async Task<IActionResult> AnalyzeJobFit([FromBody] AnalyzeJobFitRequest request)
    {
        var userId = currentUserService.UserId;
        var result = await aiService.AnalyzeJobFitAsync(userId, request.JobId);
        return Ok(ApiResponse<JobFitAnalysisResult>.Ok(result));
    }

    /// <summary>
    /// Tự động sinh mô tả công việc (Job Description) từ tiêu đề và từ khóa
    /// </summary>
    [HttpPost("generate-jd")]
    public async Task<IActionResult> GenerateJd([FromBody] GenerateJdRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(ApiResponse<GenerateJdResult>.Fail("INVALID_TITLE", "Vui lòng cung cấp tiêu đề công việc."));
        }

        var result = await aiService.GenerateJobDescriptionAsync(request.Title, request.Keywords);
        return Ok(ApiResponse<GenerateJdResult>.Ok(result));
    }

    /// <summary>
    /// Trò chuyện trực tiếp với Trợ lý Tuyển dụng AI (có nhận diện bối cảnh công việc hiện tại)
    /// </summary>
    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] AiChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(ApiResponse<string>.Fail("INVALID_MESSAGE", "Nội dung tin nhắn không được để trống."));
        }

        var userId = currentUserService.UserId;
        var reply = await aiService.ChatWithAssistantAsync(userId, request.Message, request.JobId);
        return Ok(ApiResponse<object>.Ok(new { reply }));
    }

    /// <summary>
    /// AI tự động sinh bộ câu hỏi phỏng vấn chuyên sâu dựa trên JD công việc và hồ sơ ứng viên
    /// </summary>
    [HttpPost("generate-interview-questions")]
    public async Task<IActionResult> GenerateInterviewQuestions([FromBody] GenerateInterviewQuestionsRequest request)
    {
        if (request.JobId <= 0)
        {
            return BadRequest(ApiResponse<InterviewQuestionsResult>.Fail("INVALID_JOB_ID", "Vui lòng cung cấp mã công việc hợp lệ."));
        }

        var result = await aiService.GenerateInterviewQuestionsAsync(request.JobId, request.CandidateId);
        return Ok(ApiResponse<InterviewQuestionsResult>.Ok(result));
    }
}

