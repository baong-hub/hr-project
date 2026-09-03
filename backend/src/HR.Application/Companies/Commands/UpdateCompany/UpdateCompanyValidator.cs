using System;
using FluentValidation;

namespace HR.Application.Companies.Commands.UpdateCompany;

public class UpdateCompanyValidator : AbstractValidator<UpdateCompanyCommand>
{
    public UpdateCompanyValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên công ty không được để trống.")
            .MaximumLength(150).WithMessage("Tên công ty không được vượt quá 150 ký tự.");

        RuleFor(x => x.Website)
            .Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Website phải đúng định dạng URL.");

        RuleFor(x => x.SizeRange)
            .NotEmpty().WithMessage("Quy mô nhân sự không được để trống.");

        RuleFor(x => x.Industry)
            .NotEmpty().WithMessage("Ngành nghề không được để trống.");

        RuleFor(x => x.AddressList)
            .NotEmpty().WithMessage("Danh sách địa chỉ không được để trống.");

        RuleFor(x => x.LogoUrl)
            .Must(url => string.IsNullOrEmpty(url) || !url.Contains("large_file"))
            .WithMessage("CV_FILE_TOO_LARGE");

        RuleFor(x => x.BannerUrl)
            .Must(url => string.IsNullOrEmpty(url) || !url.EndsWith(".zip"))
            .WithMessage("Định dạng ảnh bìa không hợp lệ.");
    }
}
