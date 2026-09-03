using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Companies.Dtos;
using HR.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Companies.Commands.FollowCompany;

public class FollowCompanyHandler : IRequestHandler<FollowCompanyCommand, FollowResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public FollowCompanyHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<FollowResultDto> Handle(FollowCompanyCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == 0)
        {
            throw new ForbiddenException("UNAUTHORIZED", "Người dùng chưa đăng nhập.");
        }

        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.CompanyId, cancellationToken);

        if (company == null)
        {
            throw new NotFoundException("COMPANY_NOT_FOUND", "Doanh nghiệp không tồn tại.");
        }

        // Toggle follow behavior
        var follow = await _context.CandidateFollows
            .FirstOrDefaultAsync(cf => cf.CandidateId == userId && cf.CompanyId == request.CompanyId, cancellationToken);

        bool isFollowing;

        if (follow == null)
        {
            var newFollow = new CandidateFollow
            {
                CandidateId = userId,
                CompanyId = request.CompanyId,
                FollowedAt = DateTime.Now
            };
            _context.CandidateFollows.Add(newFollow);
            isFollowing = true;
        }
        else
        {
            _context.CandidateFollows.Remove(follow);
            isFollowing = false;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var followersCount = await _context.CandidateFollows
            .CountAsync(cf => cf.CompanyId == request.CompanyId, cancellationToken);

        return new FollowResultDto(request.CompanyId, isFollowing, followersCount);
    }
}
