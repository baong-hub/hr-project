using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Models;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Applications.Commands.ChangeApplicationStatus;

public class ChangeApplicationStatusHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<ChangeApplicationStatusCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(ChangeApplicationStatusCommand request, CancellationToken cancellationToken)
    {
        var app = await context.Applications
            .Include(a => a.Job)
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (app == null)
        {
            throw new NotFoundException("APPLICATION_NOT_FOUND", "Đơn ứng tuyển không tồn tại.");
        }

        // [BR-03] Lấy đơn ứng tuyển hiện tại: Nếu đang ở trạng thái HIRED hoặc REJECTED thì ném lỗi APPLICATION_STATUS_FINAL
        if (app.Status == ApplicationStatus.HIRED || app.Status == ApplicationStatus.REJECTED)
        {
            throw new BadRequestException("APPLICATION_STATUS_FINAL", "Trạng thái đơn nộp đã hoàn thành, không thể sửa đổi.");
        }

        var userId = currentUserService.UserId;
        var employer = await context.Employers
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
        var isAdmin = currentUserService.Username == "admin";

        // Kiểm tra quyền sở hữu: Tin tuyển dụng của đơn nộp phải thuộc employerId của user hiện tại
        if (!isAdmin && (employer == null || app.Job.CompanyId != employer.CompanyId))
        {
            throw new ForbiddenException("Bạn không có quyền cập nhật trạng thái đơn ứng tuyển này.");
        }

        if (Enum.TryParse<ApplicationStatus>(request.Status, true, out var newStatus))
        {
            app.Status = newStatus;
            app.UpdatedAt = DateTime.Now;
            app.UpdatedBy = userId;
        }

        await context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
