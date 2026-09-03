using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Cvs.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Cvs.Commands.UploadCv;

public class UploadCvHandler : IRequestHandler<UploadCvCommand, CandidateCvDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UploadCvHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CandidateCvDto> Handle(UploadCvCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == 0)
        {
            throw new ForbiddenException("UNAUTHORIZED", "Người dùng chưa đăng nhập.");
        }

        // 1. Validation tệp tải lên
        if (request.ContentType != "application/pdf" && !request.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("CV_INVALID_FORMAT", "Định dạng file không hợp lệ (Chỉ nhận PDF).");
        }

        if (request.FileSizeBytes > 5 * 1024 * 1024) // 5MB limit
        {
            throw new BadRequestException("CV_FILE_TOO_LARGE", "Dung lượng file CV vượt quá 5MB.");
        }

        // Lấy hoặc tạo Candidate cho User hiện tại
        var candidate = await _context.Candidates
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (candidate == null)
        {
            candidate = new Candidate
            {
                UserId = userId,
                FullName = _currentUserService.Username ?? "Ứng viên"
            };
            _context.Candidates.Add(candidate);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 2. Kiểm tra giới hạn số lượng CV (Tối đa 5 bản)
        var existingCvCount = await _context.CandidateCvs
            .CountAsync(cv => cv.CandidateId == candidate.Id, cancellationToken);

        if (existingCvCount >= 5)
        {
            throw new BadRequestException("CV_LIMIT_EXCEEDED", "Bạn đã đạt giới hạn tối đa 5 bản CV.");
        }

        // 3. Lưu trữ tệp tin vào thư mục local wwwroot
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "cvs");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(request.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await request.FileContent.CopyToAsync(fileStream, cancellationToken);
        }

        var fileUrl = $"/uploads/cvs/{uniqueFileName}";

        // Đặt làm CV mặc định nếu là CV đầu tiên
        var isFirstCv = existingCvCount == 0;

        var cv = new CandidateCv
        {
            CandidateId = candidate.Id,
            CvTitle = request.CvTitle,
            FileUrl = fileUrl,
            FileSizeBytes = request.FileSizeBytes,
            IsDefault = isFirstCv,
            CvType = CvType.UPLOAD
        };

        _context.CandidateCvs.Add(cv);
        await _context.SaveChangesAsync(cancellationToken);

        return new CandidateCvDto(
            cv.Id,
            cv.CandidateId,
            cv.CvTitle,
            cv.FileUrl,
            cv.IsDefault,
            cv.FileSizeBytes,
            cv.CvType.ToString(),
            cv.CreatedAt,
            cv.UpdatedAt
        );
    }
}
