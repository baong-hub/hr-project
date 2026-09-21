using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using HR.Application.Subscriptions.Dtos;
using HR.Domain.Enums;
using MediatR;

namespace HR.Application.Subscriptions.Queries.GetAvailablePlans;

public record GetAvailablePlansQuery : IRequest<List<SubscriptionPlanDetailDto>>;

public class GetAvailablePlansQueryHandler : IRequestHandler<GetAvailablePlansQuery, List<SubscriptionPlanDetailDto>>
{
    public Task<List<SubscriptionPlanDetailDto>> Handle(GetAvailablePlansQuery request, CancellationToken cancellationToken)
    {
        var plans = new List<SubscriptionPlanDetailDto>
        {
            new()
            {
                Plan = SubscriptionPlan.FREE,
                Name = "FREE",
                DisplayName = "Khởi Nghiệp (Miễn Phí)",
                MonthlyPriceVnd = 0,
                MaxJobs = 3,
                MaxCvViews = 10,
                MaxRecruiters = 1,
                AiScreening = false,
                Highlights =
                [
                    "Đăng tối đa 3 tin tuyển dụng cùng lúc",
                    "Xem 10 hồ sơ ứng viên tìm năng",
                    "1 tài khoản quản lý nhà tuyển dụng",
                    "Hỗ trợ qua cộng đồng & email cơ bản"
                ]
            },
            new()
            {
                Plan = SubscriptionPlan.PRO,
                Name = "PRO",
                DisplayName = "Chuyên Nghiệp (Pro)",
                MonthlyPriceVnd = 1990000,
                MaxJobs = 15,
                MaxCvViews = 100,
                MaxRecruiters = 5,
                AiScreening = true,
                Highlights =
                [
                    "Đăng tối đa 15 tin tuyển dụng cùng lúc",
                    "Xem 100 hồ sơ ứng viên tài năng mỗi tháng",
                    "5 tài khoản thành viên tuyển dụng",
                    "Trợ lý AI tự động sàng lọc & chấm điểm CV",
                    "AI sinh đề thi trắc nghiệm theo JD",
                    "Hỗ trợ kỹ thuật 24/7 qua Live Chat"
                ]
            },
            new()
            {
                Plan = SubscriptionPlan.BUSINESS,
                Name = "BUSINESS",
                DisplayName = "Doanh Nghiệp (Business)",
                MonthlyPriceVnd = 4990000,
                MaxJobs = 50,
                MaxCvViews = 500,
                MaxRecruiters = 15,
                AiScreening = true,
                Highlights =
                [
                    "Đăng tối đa 50 tin tuyển dụng mở rộng",
                    "Mở khóa 500 hồ sơ ứng viên cao cấp",
                    "15 tài khoản phân quyền theo phòng ban",
                    "Toàn quyền tính năng Gemini AI Candidate Matching",
                    "Tin tuyển dụng gắn nhãn HOT & Ưu tiên hiển thị",
                    "Trang thương hiệu nhà tuyển dụng chuyên biệt"
                ]
            },
            new()
            {
                Plan = SubscriptionPlan.ENTERPRISE,
                Name = "ENTERPRISE",
                DisplayName = "Tập Đoàn (Enterprise)",
                MonthlyPriceVnd = 9990000,
                MaxJobs = 9999,
                MaxCvViews = 2500,
                MaxRecruiters = 50,
                AiScreening = true,
                Highlights =
                [
                    "Đăng tin tuyển dụng KHÔNG GIỚI HẠN",
                    "Xem 2.500 hồ sơ ứng viên chất lượng cao",
                    "50 tài khoản quản lý tuyển dụng",
                    "Tích hợp API tùy chỉnh & Single Sign-On (SSO)",
                    "Chuyên viên nhân sự tư vấn đồng hành riêng biệt",
                    "Cam kết SLA 99.9% khả dụng"
                ]
            }
        };

        return Task.FromResult(plans);
    }
}
