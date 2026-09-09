using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.Auth.Dtos;

namespace HR.Application.Auth.Commands.RegisterEmployer;

public class RegisterEmployerHandler : IRequestHandler<RegisterEmployerCommand, UserDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterEmployerHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserDto> Handle(RegisterEmployerCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLower();
        var emailExists = await _context.Users.AnyAsync(u => u.Email == email, cancellationToken);
        if (emailExists)
        {
            throw new ConflictException("AUTH_EMAIL_ALREADY_EXISTS", "Email đã được sử dụng trên hệ thống");
        }

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "EMPLOYER" || r.Name == "Nhà tuyển dụng", cancellationToken);
        if (role == null)
        {
            throw new NotFoundException("ROLE_NOT_FOUND", "Không tìm thấy vai trò Nhà tuyển dụng (EMPLOYER) trên hệ thống");
        }

        // Check or create company
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Name == request.CompanyName, cancellationToken);
        if (company == null)
        {
            company = new Company
            {
                Code = "COM_" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                Name = request.CompanyName.Trim(),
                Industry = "Công nghệ thông tin",
                SizeRange = "10-50",
                AddressList = "Hà Nội, Việt Nam",
                VerificationStatus = HR.Domain.Enums.CompanyVerificationStatus.VERIFIED,
                IsActive = true
            };
            _context.Companies.Add(company);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var site = await _context.Sites.FirstOrDefaultAsync(cancellationToken);
        var siteId = site?.Id ?? 1;

        var user = new User
        {
            Username = email,
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            PhoneNumber = request.PhoneNumber.Trim(),
            FullName = request.FullName.Trim(),
            RoleId = role.Id,
            SiteId = siteId,
            Status = UserStatus.PENDING_APPROVAL
        };

        _context.Users.Add(user);

        var employer = new Employer
        {
            User = user,
            Company = company,
            Position = request.Position.Trim(),
            RoleInCompany = RoleInCompany.RECRUITER
        };

        _context.Employers.Add(employer);
        _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });

        var rolePerms = await _context.RolePermissions
            .Where(rp => rp.RoleId == role.Id)
            .ToListAsync(cancellationToken);

        foreach (var rp in rolePerms)
        {
            _context.UserPermissions.Add(new UserPermission
            {
                UserId = user.Id,
                PermissionId = rp.PermissionId,
                DataScope = rp.DataScope,
                IsCustom = false
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = role.Name,
            Status = user.Status.ToString()
        };
    }
}
