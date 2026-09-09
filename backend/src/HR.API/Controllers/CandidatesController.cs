using System.Collections.Generic;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Models;
using HR.Application.Cvs.Dtos;
using HR.Application.Cvs.Commands.UpdateProfile;
using HR.Application.Cvs.Commands.UploadCv;
using HR.Application.Cvs.Commands.SetDefaultCv;
using HR.Application.Cvs.Commands.DeleteCv;
using HR.Application.Cvs.Queries.GetCandidateCvs;
using HR.Application.Cvs.Queries.SearchCandidates;
using HR.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/candidates")]
[Authorize]
public class CandidatesController(IMediator mediator) : ControllerBase
{
    // EP-00: Lấy hồ sơ năng lực của ứng viên hiện tại
    [HttpGet("profile")]
    [RequirePermission("cv:manage")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await mediator.Send(new HR.Application.Cvs.Queries.GetCandidateProfile.GetMyCandidateProfileQuery());
        if (result == null)
        {
            throw new NotFoundException("CANDIDATE_NOT_FOUND", "Không tìm thấy thông tin hồ sơ ứng viên.");
        }
        return Ok(ApiResponse<CandidateProfileDto>.Ok(result));
    }

    // EP-01: Cập nhật hồ sơ năng lực
    [HttpPut("profile")]
    [RequirePermission("cv:manage")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(result));
    }

    // EP-02: Tải lên file CV (PDF)
    [HttpPost("cvs")]
    [RequirePermission("cv:manage")]
    public async Task<IActionResult> UploadCv([FromForm] string cvTitle, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new BadRequestException("CV_INVALID_FILE", "Tệp tin tải lên không hợp lệ.");
        }

        using var stream = file.OpenReadStream();
        var result = await mediator.Send(new UploadCvCommand(
            cvTitle,
            stream,
            file.FileName,
            file.ContentType,
            file.Length
        ));
        
        return StatusCode(StatusCodes.Status201Created, ApiResponse<CandidateCvDto>.Ok(result));
    }

    // EP-03: Lấy danh sách CV của ứng viên
    [HttpGet("cvs")]
    [RequirePermission("cv:manage")]
    public async Task<IActionResult> GetCvs()
    {
        var result = await mediator.Send(new GetCandidateCvsQuery());
        return Ok(ApiResponse<List<CandidateCvDto>>.Ok(result));
    }

    // EP-04: Đặt làm CV chính (mặc định)
    [HttpPatch("cvs/{id:int}/main")]
    [RequirePermission("cv:manage")]
    public async Task<IActionResult> SetDefaultCv(int id)
    {
        var result = await mediator.Send(new SetDefaultCvCommand(id));
        return Ok(ApiResponse<bool>.Ok(result));
    }

    // EP-05: Xóa CV
    [HttpDelete("cvs/{id:int}")]
    [RequirePermission("cv:manage")]
    public async Task<IActionResult> DeleteCv(int id)
    {
        var result = await mediator.Send(new DeleteCvCommand(id));
        return Ok(ApiResponse<bool>.Ok(result));
    }

    // EP-06: Tìm kiếm hồ sơ ứng viên (Dành cho Employer)
    [HttpGet]
    [RequirePermission("cv:search", "cvs:view", "job:manage", "jobs:view")]
    public async Task<IActionResult> Search([FromQuery] SearchCandidatesQuery query)
    {
        var result = await mediator.Send(query);
        return Ok(ApiResponse<List<CandidateProfileDto>>.Ok(result));
    }

    public record InviteCandidateRequest(int JobId, string? Message);

    // EP-07: Mời ứng viên ứng tuyển vào Job (Active Talent Sourcing)
    [HttpPost("{id:int}/invite-job")]
    [RequirePermission("job:manage", "jobs:create", "cv:search", "cvs:view")]
    public async Task<IActionResult> InviteJob(int id, [FromBody] InviteCandidateRequest request)
    {
        var result = await mediator.Send(new HR.Application.Cvs.Commands.InviteCandidateToJob.InviteCandidateToJobCommand(id, request.JobId, request.Message));
        return Ok(ApiResponse<bool>.Ok(result));
    }
}
