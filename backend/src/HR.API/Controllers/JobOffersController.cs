using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Models;
using HR.Application.JobOffers.Commands.CancelJobOffer;
using HR.Application.JobOffers.Commands.CreateJobOffer;
using HR.Application.JobOffers.Commands.RespondJobOffer;
using HR.Application.JobOffers.Dtos;
using HR.Application.JobOffers.Queries.GetJobOfferByApplicationId;
using HR.Application.JobOffers.Queries.GetJobOfferById;
using HR.Application.JobOffers.Queries.GetJobOffersByCandidate;
using HR.Application.JobOffers.Queries.GetJobOffersByEmployer;
using HR.Domain.Enums;
using HR.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HR.API.Controllers;

[ApiController]
[Route("api/v1/job-offers")]
[Authorize]
public class JobOffersController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Phát hành thư mời nhận việc (Job Offer) cho ứng viên
    /// </summary>
    [HttpPost]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> CreateOffer([FromBody] CreateJobOfferRequest request)
    {
        var result = await mediator.Send(new CreateJobOfferCommand(request));
        return StatusCode(StatusCodes.Status201Created, ApiResponse<JobOfferDto>.Ok(result));
    }

    /// <summary>
    /// Tải lên file thư mời nhận việc chính thức (PDF Offer Letter)
    /// </summary>
    [HttpPost("upload-letter")]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> UploadOfferLetter(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new BadRequestException("INVALID_FILE", "Tệp tin tải lên không hợp lệ.");
        }

        if (file.ContentType != "application/pdf" && !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("INVALID_FILE_FORMAT", "Chỉ chấp nhận file định dạng PDF.");
        }

        if (file.Length > 10 * 1024 * 1024) // 10MB limit
        {
            throw new BadRequestException("FILE_TOO_LARGE", "Dung lượng file vượt quá giới hạn 10MB.");
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "offers");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"Offer_{Guid.NewGuid():N}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/offers/{uniqueFileName}";
        return Ok(ApiResponse<object>.Ok(new
        {
            fileUrl,
            fileName = file.FileName,
            fileSizeBytes = file.Length
        }));
    }

    /// <summary>
    /// Ứng viên tương tác phản hồi Thư mời (Chấp nhận, Yêu cầu thương lượng, Từ chối)
    /// </summary>
    [HttpPost("{id:int}/respond")]
    [RequirePermission("job:apply")]
    public async Task<IActionResult> RespondOffer(int id, [FromBody] RespondJobOfferRequest request)
    {
        var result = await mediator.Send(new RespondJobOfferCommand(id, request));
        return Ok(ApiResponse<JobOfferDto>.Ok(result));
    }

    /// <summary>
    /// Nhà tuyển dụng thu hồi / huỷ bỏ thư mời nhận việc
    /// </summary>
    [HttpPost("{id:int}/cancel")]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> CancelOffer(int id, [FromBody] CancelJobOfferRequest? request)
    {
        var result = await mediator.Send(new CancelJobOfferCommand(id, request?.Reason));
        return Ok(ApiResponse<JobOfferDto>.Ok(result));
    }

    /// <summary>
    /// Xem chi tiết Thư mời nhận việc theo ID
    /// </summary>
    [HttpGet("{id:int}")]
    [RequirePermission("job:apply", "job:manage")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await mediator.Send(new GetJobOfferByIdQuery(id));
        return Ok(ApiResponse<JobOfferDto>.Ok(result));
    }

    /// <summary>
    /// Lấy Thư mời nhận việc mới nhất của một hồ sơ ứng tuyển (Application)
    /// </summary>
    [HttpGet("application/{applicationId:int}")]
    [RequirePermission("job:apply", "job:manage")]
    public async Task<IActionResult> GetByApplicationId(int applicationId)
    {
        var result = await mediator.Send(new GetJobOfferByApplicationIdQuery(applicationId));
        return Ok(ApiResponse<JobOfferDto?>.Ok(result));
    }

    /// <summary>
    /// Danh sách Thư mời nhận việc của Nhà tuyển dụng
    /// </summary>
    [HttpGet("employer")]
    [RequirePermission("job:manage")]
    public async Task<IActionResult> GetEmployerOffers([FromQuery] int? jobId, [FromQuery] JobOfferStatus? status)
    {
        var result = await mediator.Send(new GetJobOffersByEmployerQuery(jobId, status));
        return Ok(ApiResponse<List<JobOfferDto>>.Ok(result));
    }

    /// <summary>
    /// Danh sách Thư mời nhận việc của Ứng viên đang đăng nhập
    /// </summary>
    [HttpGet("candidate")]
    [RequirePermission("job:apply")]
    public async Task<IActionResult> GetCandidateOffers([FromQuery] JobOfferStatus? status)
    {
        var result = await mediator.Send(new GetJobOffersByCandidateQuery(status));
        return Ok(ApiResponse<List<JobOfferDto>>.Ok(result));
    }
}

public class CancelJobOfferRequest
{
    public string? Reason { get; set; }
}
