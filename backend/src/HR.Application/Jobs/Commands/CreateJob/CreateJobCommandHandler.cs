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
    private readonly IFraudScannerService _fraudScanner;

    public CreateJobCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IFraudScannerService fraudScanner)
    {
        _context = context;
        _currentUserService = currentUserService;
        _fraudScanner = fraudScanner;
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

        // Scan for potential fraud / scam triggers
        var scanResult = _fraudScanner.ScanJob(
            request.Title,
            request.Description,
            request.Requirements,
            request.Benefits,
            request.SalaryFrom,
            request.SalaryTo,
            request.ExperienceLevel);

        var workMode = Enum.TryParse<WorkMode>(request.WorkMode, true, out var wm) ? wm : WorkMode.ONSITE;
        var salaryType = Enum.TryParse<SalaryType>(request.SalaryType, true, out var st) ? st : SalaryType.NEGOTIABLE;

        var job = new Job
        {
            CompanyId = employer.CompanyId.Value,
            EmployerId = employer.Id,
            Title = request.Title,
            Department = request.Department,
            Category = request.Category ?? string.Empty,
            EmploymentType = request.EmploymentType ?? "Full-time",
            Country = request.Country ?? "VIETNAM",
            City = request.City,
            District = request.District,
            Office = request.Office,
            WorkMode = workMode,
            SalaryType = salaryType,
            ExperienceLevel = request.ExperienceLevel ?? string.Empty,
            ExperienceYearsMin = request.ExperienceYearsMin,
            Education = request.Education,
            ProbationDuration = request.ProbationDuration,
            Openings = request.Openings ?? 1,
            Description = request.Description,
            Requirements = request.Requirements,
            Benefits = request.Benefits,
            SalaryFrom = request.SalaryFrom,
            SalaryTo = request.SalaryTo,
            Status = scanResult.IsHighRisk ? JobStatus.REJECTED : JobStatus.PENDING_REVIEW,
            RiskScore = scanResult.RiskScore,
            FraudWarningFlags = scanResult.DetectedFlags.Count > 0 ? string.Join(", ", scanResult.DetectedFlags) : null,
            ModerationStatus = scanResult.IsHighRisk ? "FLAGGED_RISK" : (scanResult.RiskScore > 0 ? "PENDING_REVIEW" : "APPROVED"),
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
            job.CreatedAt,
            job.IsFeatured,
            job.FeaturedUntil,
            job.IsUrgent,
            job.UrgentUntil,
            job.RiskScore,
            job.FraudWarningFlags,
            job.ModerationStatus,
            job.CompanyId,
            job.Department,
            job.Category,
            job.EmploymentType,
            job.Country,
            job.District,
            job.Office,
            job.WorkMode.ToString(),
            job.SalaryType.ToString(),
            job.ExperienceLevel,
            job.ExperienceYearsMin,
            job.Education,
            job.ProbationDuration,
            job.Openings,
            job.HiredCount
        );
    }
}
