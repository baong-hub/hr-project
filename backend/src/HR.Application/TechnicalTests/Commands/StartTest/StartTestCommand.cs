using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.TechnicalTests.Commands.StartTest;

public record StartTestCommand(int TestId) : IRequest<ApiResponse<StartTestResultDto>>;

public class StartTestResultDto
{
    public int TestId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int DurationMinutes { get; set; }
    public DateTime ServerCurrentTime { get; set; }
}

public class StartTestCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService
) : IRequestHandler<StartTestCommand, ApiResponse<StartTestResultDto>>
{
    public async Task<ApiResponse<StartTestResultDto>> Handle(
        StartTestCommand request,
        CancellationToken cancellationToken)
    {
        var test = await context.TechnicalTests
            .Include(t => t.Application)
                .ThenInclude(a => a.Candidate)
            .FirstOrDefaultAsync(t => t.Id == request.TestId, cancellationToken);

        if (test == null)
        {
            throw new NotFoundException("TEST_NOT_FOUND", "Không tìm thấy bài kiểm tra.");
        }

        if (test.Status == TechnicalTestStatus.PASSED || test.Status == TechnicalTestStatus.FAILED)
        {
            throw new BadRequestException("TEST_ALREADY_COMPLETED", "Bài kiểm tra này đã hoàn thành, không thể làm lại.");
        }

        var now = DateTime.Now;

        // Nếu chưa bắt đầu, ghi nhận StartTime
        if (test.StartTime == null || test.Status == TechnicalTestStatus.PENDING)
        {
            test.StartTime = now;
            test.Status = TechnicalTestStatus.IN_PROGRESS;
            test.UpdatedAt = now;
            await context.SaveChangesAsync(cancellationToken);
        }

        var startTime = test.StartTime.Value;
        var expiresAt = startTime.AddMinutes(test.DurationMinutes);

        // Kiểm tra xem đã quá hạn thời gian làm bài chưa
        if (now > expiresAt.AddMinutes(2)) // 2 phút buffer
        {
            test.Status = TechnicalTestStatus.EXPIRED;
            await context.SaveChangesAsync(cancellationToken);
            throw new BadRequestException("TEST_TIME_EXPIRED", "Thời gian làm bài thi đã kết thúc.");
        }

        return ApiResponse<StartTestResultDto>.Ok(new StartTestResultDto
        {
            TestId = test.Id,
            StartTime = startTime,
            ExpiresAt = expiresAt,
            DurationMinutes = test.DurationMinutes,
            ServerCurrentTime = now
        });
    }
}
