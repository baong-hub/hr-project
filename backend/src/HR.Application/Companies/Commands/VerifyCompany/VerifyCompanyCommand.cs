using System;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Companies.Dtos;
using HR.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HR.Application.Companies.Commands.VerifyCompany;

public record VerifyCompanyCommand(int CompanyId, string Action, string? TaxCode = null) : IRequest<CompanyDto>;

public class VerifyCompanyCommandHandler(
    IApplicationDbContext context) : IRequestHandler<VerifyCompanyCommand, CompanyDto>
{
    public async Task<CompanyDto> Handle(VerifyCompanyCommand request, CancellationToken cancellationToken)
    {
        var company = await context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.CompanyId, cancellationToken);

        if (company == null)
        {
            throw new NotFoundException("COMPANY_NOT_FOUND", "Doanh nghiệp không tồn tại.");
        }

        var act = request.Action.Trim().ToUpperInvariant();
        if (act == "REQUEST_VERIFICATION" || act == "REQUEST")
        {
            if (!string.IsNullOrWhiteSpace(request.TaxCode))
            {
                company.TaxCode = request.TaxCode.Trim();
            }
            company.VerificationStatus = CompanyVerificationStatus.PENDING_VERIFICATION;
        }
        else if (act == "VERIFY" || act == "APPROVE")
        {
            company.VerificationStatus = CompanyVerificationStatus.VERIFIED;
            company.IsVerified = true;
        }
        else if (act == "REJECT")
        {
            company.VerificationStatus = CompanyVerificationStatus.REJECTED;
            company.IsVerified = false;
        }

        await context.SaveChangesAsync(cancellationToken);

        var followersCount = await context.CandidateFollows
            .CountAsync(cf => cf.CompanyId == company.Id, cancellationToken);

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
            false,
            company.IsVerified || company.VerificationStatus == CompanyVerificationStatus.VERIFIED,
            company.VideoUrl,
            company.OfficeGallery,
            company.CultureHighlights,
            company.CompanyFaqs,
            company.Testimonials
        );
    }
}
