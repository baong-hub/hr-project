using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.ViolationReports.Commands.CreateViolationReport;
using HR.Application.ViolationReports.Commands.ResolveViolationReport;
using HR.Application.ViolationReports.Dtos;
using HR.Application.ViolationReports.Queries.GetViolationReports;
using HR.Domain.Enums;
using HR.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/violation-reports")]
[Authorize]
public class ViolationReportsController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Người dùng / Ứng viên gửi báo cáo vi phạm (tin giả mạo, lừa đảo, sai thông tin)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateReport([FromBody] CreateViolationReportRequest request)
    {
        var result = await mediator.Send(new CreateViolationReportCommand(request));
        return StatusCode(201, ApiResponse<ViolationReportDto>.Ok(result));
    }

    /// <summary>
    /// Quản trị viên / Kiểm duyệt viên xem danh sách các báo cáo vi phạm
    /// </summary>
    [HttpGet]
    [RequirePermission("job:moderate", "job:manage", "user-role:view")]
    public async Task<IActionResult> GetReports([FromQuery] ViolationStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetViolationReportsQuery(status, page, pageSize));
        return Ok(ApiResponse<PaginatedResult<ViolationReportDto>>.Ok(result));
    }

    /// <summary>
    /// Xử lý báo cáo vi phạm (Duyệt, phản hồi và tùy chọn ẩn tin tuyển dụng/doanh nghiệp vi phạm)
    /// </summary>
    [HttpPost("{id:int}/resolve")]
    [RequirePermission("job:moderate", "job:manage", "user-role:manage")]
    public async Task<IActionResult> ResolveReport(int id, [FromBody] ResolveViolationReportRequest request)
    {
        var result = await mediator.Send(new ResolveViolationReportCommand(id, request));
        return Ok(ApiResponse<bool>.Ok(result));
    }
}
