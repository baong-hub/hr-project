using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.Jobs.Dtos;
using HR.Domain.Entities;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Jobs.Commands.CreateJob;

public class CreateJobCommandHandler : IRequestHandler<CreateJobCommand, JobDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateJobCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<JobDto> Handle(CreateJobCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == 0)
        {
            throw new ForbiddenException("UNAUTHORIZED", "Người dùng chưa đăng nhập.");
        }

        var employer = await _context.Employers
            .Include(e => e.Company)
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

        if (employer == null)
        {
            throw new ForbiddenException("JOB_EMPLOYER_NOT_ACTIVE", "Tài khoản nhà tuyển dụng chưa kích hoạt.");
        }

        // [BR-03] Only verified companies can create jobs or publish them
        if (employer.Company == null || !employer.Company.IsVerified || !employer.CompanyId.HasValue)
        {
            throw new ForbiddenException("JOB_EMPLOYER_NOT_ACTIVE", "Tài khoản doanh nghiệp chưa được duyệt (VERIFIED).");
        }

        var job = new Job
        {
            CompanyId = employer.CompanyId.Value,
            EmployerId = employer.Id,
            Title = request.Title,
            Description = request.Description,
            Requirements = request.Requirements,
            Benefits = request.Benefits,
            SalaryFrom = request.SalaryFrom,
            SalaryTo = request.SalaryTo,
            City = request.City,
            Status = JobStatus.PENDING_REVIEW, // Wait for admin review
            ExpiredAt = request.ExpiredAt,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.Jobs.Add(job);
        await _context.SaveChangesAsync(cancellationToken);

        return new JobDto(
            job.Id,
            job.EmployerId,
            employer.Company!.Name,
            employer.Company!.LogoUrl,
            job.Title,
            job.Description,
            job.Requirements,
            job.Benefits,
            job.SalaryFrom,
            job.SalaryTo,
            job.City,
            job.Status.ToString(),
            job.ExpiredAt,
            job.CreatedAt
        );
    }
}
