using FluentValidation;
using HR.Domain.Enums;

namespace HR.Application.Subscriptions.Commands.CreateCheckout;

public class CreateCheckoutValidator : AbstractValidator<CreateCheckoutCommand>
{
    public CreateCheckoutValidator()
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thông tin đơn hàng thanh toán không được để trống.");
        When(x => x.Request != null, () =>
        {
            RuleFor(x => x.Request.Plan)
                .IsInEnum().WithMessage("Gói dịch vụ không hợp lệ.")
                .Must(p => p != SubscriptionPlan.FREE).WithMessage("Gói miễn phí không cần thực hiện thanh toán.");
            RuleFor(x => x.Request.Months)
                .InclusiveBetween(1, 36).WithMessage("Số tháng đăng ký phải từ 1 đến 36 tháng.");
        });
    }
}
