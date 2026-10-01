using FluentValidation;

namespace HR.Application.TechnicalTests.Commands.SaveAssessmentTemplate;

public class SaveAssessmentTemplateValidator : AbstractValidator<SaveAssessmentTemplateCommand>
{
    public SaveAssessmentTemplateValidator()
    {
        RuleFor(x => x.JobId).GreaterThan(0).WithMessage("ID tin tuyển dụng không hợp lệ.");
        RuleFor(x => x.Title).NotEmpty().WithMessage("Tiêu đề bài đề thi đánh giá không được để trống.");
        RuleFor(x => x.DurationMinutes).InclusiveBetween(5, 300).WithMessage("Thời gian làm bài phải từ 5 đến 300 phút.");
        RuleFor(x => x.PassingScore).InclusiveBetween(10, 100).WithMessage("Điểm đạt phải từ 10 đến 100.");
        RuleFor(x => x.Questions).NotNull().WithMessage("Danh sách câu hỏi không được null.");
    }
}
