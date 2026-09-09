using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Companies.Dtos;
using HR.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Companies.Commands.UpdateCompany;

public class UpdateCompanyHandler : IRequestHandler<UpdateCompanyCommand, CompanyDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCompanyHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CompanyDto> Handle(UpdateCompanyCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == 0)
        {
            throw new ForbiddenException("UNAUTHORIZED", "Người dùng chưa đăng nhập.");
        }

        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (company == null)
        {
            throw new NotFoundException("COMPANY_NOT_FOUND", "Doanh nghiệp không tồn tại.");
        }

        // Check verification permissions
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        bool isAdmin = user?.Role?.Name == "ADMIN";

        if (!isAdmin)
        {
            var employer = await _context.Employers
                .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

            if (employer == null || employer.CompanyId != request.Id)
            {
                throw new ForbiddenException("COMPANY_FORBIDDEN_UPDATE", "Bạn không có quyền cập nhật thông tin doanh nghiệp này.");
            }
        }

        // Update fields
        company.Name = request.Name;
        company.LogoUrl = request.LogoUrl;
        company.BannerUrl = request.BannerUrl;
        company.Description = request.Description;
        company.Website = request.Website;
        company.SizeRange = request.SizeRange;
        company.Industry = request.Industry;
        company.Address = request.AddressList; // addressList from API maps to address in DB

        if (request.Benefits != null) company.Benefits = request.Benefits;
        if (request.VideoUrl != null) company.VideoUrl = request.VideoUrl;
        if (request.OfficeGallery != null) company.OfficeGallery = request.OfficeGallery;
        if (request.CultureHighlights != null) company.CultureHighlights = request.CultureHighlights;
        if (request.CompanyFaqs != null) company.CompanyFaqs = request.CompanyFaqs;
        if (request.Testimonials != null) company.Testimonials = request.Testimonials;
        if (request.SocialLinks != null) company.SocialLinks = request.SocialLinks;
        if (request.Contact != null) company.Contact = request.Contact;

        _context.Companies.Update(company);
        await _context.SaveChangesAsync(cancellationToken);

        // Get followers data
        var followersCount = await _context.CandidateFollows
            .CountAsync(cf => cf.CompanyId == company.Id, cancellationToken);

        bool isFollowing = await _context.CandidateFollows
            .AnyAsync(cf => cf.CandidateId == userId && cf.CompanyId == company.Id, cancellationToken);

        return new CompanyDto(
            company.Id,
            company.Name,
            company.LogoUrl,
            company.BannerUrl,
            company.TaxCode,
            company.Website,
            company.Industry,
            company.SizeRange,
            company.FoundedYear,
            company.Address,
            company.Description,
            company.Benefits,
            company.Contact,
            company.SocialLinks,
            company.VerificationStatus.ToString(),
            followersCount,
            isFollowing,
            company.VideoUrl,
            company.OfficeGallery,
            company.CultureHighlights,
            company.CompanyFaqs,
            company.Testimonials
        );
    }
}
