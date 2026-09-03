using FluentValidation;

namespace HR.Application.Cvs.Commands.UploadCv;

public class UploadCvValidator : AbstractValidator<UploadCvCommand>
{
    public UploadCvValidator()
    {
        RuleFor(x => x.CvTitle)
            .NotEmpty().WithMessage("Tiêu đề CV không được để trống.")
            .MaximumLength(100).WithMessage("Tiêu đề CV không được vượt quá 100 ký tự.");

        RuleFor(x => x.FileContent)
            .NotNull().WithMessage("Dữ liệu tệp CV không được để trống.");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("Tên tệp không được để trống.");
    }
}
