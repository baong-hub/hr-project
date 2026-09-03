using FluentValidation;

namespace HR.Application.Profile;

public class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.OldPassword)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu cũ.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu mới.")
            .MinimumLength(8).WithMessage("Mật khẩu mới phải có tối thiểu 8 ký tự.")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ cái viết hoa.")
            .Matches(@"[a-z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ cái viết thường.")
            .Matches(@"[0-9]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ số.")
            .Matches(@"[^\w\s]").WithMessage("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt.");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Vui lòng nhập lại mật khẩu mới.")
            .Equal(x => x.NewPassword).WithMessage("Mật khẩu nhập lại không trùng khớp.");
    }
}

