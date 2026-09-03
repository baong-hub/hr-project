using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HR.Domain.Entities;
using HR.Domain.Enums;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Exceptions;
using HR.Application.Auth.Dtos;

namespace HR.Application.Auth.Commands.RegisterCandidate;

public class RegisterCandidateHandler : IRequestHandler<RegisterCandidateCommand, UserDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterCandidateHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserDto> Handle(RegisterCandidateCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLower();
        var emailExists = await _context.Users.AnyAsync(u => u.Email == email, cancellationToken);
        if (emailExists)
        {
            throw new ConflictException("AUTH_EMAIL_ALREADY_EXISTS", "Email đã được sử dụng trên hệ thống");
        }

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "CANDIDATE" || r.Name == "Ứng viên", cancellationToken);
        if (role == null)
        {
            throw new NotFoundException("ROLE_NOT_FOUND", "Không tìm thấy vai trò Ứng viên (CANDIDATE) trên hệ thống");
        }

        var site = await _context.Sites.FirstOrDefaultAsync(cancellationToken);
        var siteId = site?.Id ?? 1;

        var user = new User
        {
            Username = email,
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            PhoneNumber = request.PhoneNumber.Trim(),
            RoleId = role.Id,
            SiteId = siteId,
            Status = UserStatus.ACTIVE
        };

        _context.Users.Add(user);

        var candidate = new Candidate
        {
            FullName = request.FullName.Trim(),
            User = user
        };

        _context.Candidates.Add(candidate);
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
