using FluentValidation;

namespace HR.Application.Auth.Commands.RegisterCandidate;

public class RegisterCandidateValidator : AbstractValidator<RegisterCandidateCommand>
{
    public RegisterCandidateValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống")
            .EmailAddress().WithMessage("Email không hợp lệ")
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống")
            .MinimumLength(8).WithMessage("Mật khẩu tối thiểu 8 ký tự")
            .MaximumLength(50).WithMessage("Mật khẩu tối đa 50 ký tự")
            .Matches("[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ hoa")
            .Matches("[a-z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ thường")
            .Matches("[0-9]").WithMessage("Mật khẩu phải chứa ít nhất một chữ số");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Số điện thoại không được để trống")
            .Matches(@"^(0|\+84)(3|5|7|8|9)[0-9]{8}$").WithMessage("Số điện thoại không hợp lệ");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên không được để trống")
            .MaximumLength(100).WithMessage("Họ tên tối đa 100 ký tự");
    }
}
