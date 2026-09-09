using System.Collections.Generic;
using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.TechnicalTests.Commands.GenerateAiQuestions;
using HR.Application.TechnicalTests.Commands.InviteCandidateTest;
using HR.Application.TechnicalTests.Commands.SaveAssessmentTemplate;
using HR.Application.TechnicalTests.Commands.StartTest;
using HR.Application.TechnicalTests.Commands.SubmitTest;
using HR.Application.TechnicalTests.Models;
using HR.Application.TechnicalTests.Queries.GetAssessmentTemplateByJob;
using HR.Application.TechnicalTests.Queries.GetTestForCandidate;
using HR.Application.TechnicalTests.Queries.GetTestResult;
using HR.Application.TechnicalTests.Queries.GetTestsByJob;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/technical-tests")]
[Authorize]
public class TechnicalTestsController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Nhà tuyển dụng lưu / cập nhật đề thi gắn liền với tin tuyển dụng (Job)
    /// </summary>
    [HttpPost("template")]
    public async Task<IActionResult> SaveTemplate([FromBody] SaveAssessmentTemplateCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Lấy cấu hình đề thi của một tin tuyển dụng
    /// </summary>
    [HttpGet("template/{jobId}")]
    public async Task<IActionResult> GetTemplateByJob([FromRoute] int jobId)
    {
        var result = await mediator.Send(new GetAssessmentTemplateByJobQuery(jobId));
        return Ok(result);
    }

    /// <summary>
    /// AI tự động sinh bộ câu hỏi trắc nghiệm đề thi dựa trên JD của Job
    /// </summary>
    [HttpPost("generate-questions")]
    public async Task<IActionResult> GenerateAiQuestions([FromBody] GenerateAiQuestionsCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Mời ứng viên làm bài kiểm tra năng lực (gửi In-app + Email)
    /// </summary>
    [HttpPost("invite")]
    public async Task<IActionResult> InviteCandidate([FromBody] InviteCandidateTestCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin đề thi để ứng viên làm bài trực tuyến (ẩn đáp án đúng)
    /// </summary>
    [HttpGet("{testId}/take")]
    public async Task<IActionResult> GetTestForCandidate([FromRoute] int testId)
    {
        var result = await mediator.Send(new GetTestForCandidateQuery(testId));
        return Ok(result);
    }

    /// <summary>
    /// Bắt đầu làm bài thi - Khởi động đồng hồ đếm ngược thời gian thực
    /// </summary>
    [HttpPost("{testId}/start")]
    public async Task<IActionResult> StartTest([FromRoute] int testId)
    {
        var result = await mediator.Send(new StartTestCommand(testId));
        return Ok(result);
    }

    /// <summary>
    /// Nộp bài thi trực tuyến - Tự động chấm điểm, nếu >= PassingScore tự động chuyển SHORTLISTED và mở lịch phỏng vấn
    /// </summary>
    [HttpPost("{testId}/submit")]
    public async Task<IActionResult> SubmitTest(
        [FromRoute] int testId,
        [FromBody] SubmitTestRequest request)
    {
        var command = new SubmitTestCommand(testId, request.Answers);
        var result = await mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Xem kết quả chi tiết bài kiểm tra (điểm, đáp án đúng/sai, lời giải thích)
    /// </summary>
    [HttpGet("{testId}/result")]
    public async Task<IActionResult> GetTestResult([FromRoute] int testId)
    {
        var result = await mediator.Send(new GetTestResultQuery(testId));
        return Ok(result);
    }

    /// <summary>
    /// Danh sách kết quả bài test của các ứng viên ứng tuyển vào một tin tuyển dụng
    /// </summary>
    [HttpGet("by-job/{jobId}")]
    public async Task<IActionResult> GetTestsByJob([FromRoute] int jobId)
    {
        var result = await mediator.Send(new GetTestsByJobQuery(jobId));
        return Ok(result);
    }
}

public class SubmitTestRequest
{
    public List<SubmitAnswerItem> Answers { get; set; } = new();
}
