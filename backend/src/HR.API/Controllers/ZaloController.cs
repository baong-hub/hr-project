using System.Collections.Generic;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/zalo")]
[Authorize]
public class ZaloController : ControllerBase
{
    private readonly IZaloZnsService _zaloZnsService;

    public ZaloController(IZaloZnsService zaloZnsService)
    {
        _zaloZnsService = zaloZnsService;
    }

    /// <summary>
    /// Kiểm tra trạng thái kết nối Zalo OA và dịch vụ Zalo ZNS
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        var status = _zaloZnsService.GetServiceStatus();
        return Ok(ApiResponse<ZaloZnsStatusDto>.Ok(status));
    }

    /// <summary>
    /// Gửi thông báo ZNS thử nghiệm đến một số điện thoại
    /// </summary>
    [HttpPost("test-send")]
    public async Task<IActionResult> TestSendZns([FromBody] TestSendZnsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(ApiResponse<ZnsSendResult>.Fail("VALIDATION_FAILED", "Vui lòng nhập số điện thoại người nhận."));
        }

        var templateId = string.IsNullOrWhiteSpace(request.TemplateId) ? "ZNS_INTERVIEW_INVITE_V1" : request.TemplateId;
        var data = request.TemplateData ?? new Dictionary<string, string>
        {
            ["candidate_name"] = "Nguyễn Văn Ứng Viên (Test)",
            ["company_name"] = "HR Portal Demo",
            ["job_title"] = "Senior Fullstack Engineer",
            ["interview_time"] = "09:30 - Ngày mai",
            ["location_link"] = "https://meet.google.com/demo-zns"
        };

        var result = await _zaloZnsService.SendTestZnsAsync(request.PhoneNumber, templateId, data);
        return Ok(ApiResponse<ZnsSendResult>.Ok(result));
    }
}

public class TestSendZnsRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string? TemplateId { get; set; }
    public Dictionary<string, string>? TemplateData { get; set; }
}
