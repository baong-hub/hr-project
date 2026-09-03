using FluentValidation;

namespace HR.Application.UserRoles;

public class CreateRoleValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Tên vai trò không được để trống")
            .MinimumLength(2).WithMessage("Tên vai trò ít nhất 2 ký tự")
            .MaximumLength(100).WithMessage("Tên vai trò tối đa 100 ký tự");
    }
}

public class UpdateRoleValidator : AbstractValidator<UpdateRoleCommand>
{
    public UpdateRoleValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().WithMessage("Tên vai trò không được để trống")
            .MinimumLength(2).WithMessage("Tên vai trò ít nhất 2 ký tự")
            .MaximumLength(100).WithMessage("Tên vai trò tối đa 100 ký tự");
    }
}

public class CloneRoleValidator : AbstractValidator<CloneRoleCommand>
{
    public CloneRoleValidator()
    {
        RuleFor(x => x.SourceRoleId).GreaterThan(0);
        RuleFor(x => x.NewName).NotEmpty().WithMessage("Tên vai trò mới không được để trống")
            .MinimumLength(2).WithMessage("Tên vai trò ít nhất 2 ký tự");
    }
}

