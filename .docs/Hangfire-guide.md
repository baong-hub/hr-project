# Hangfire Development Guide

Tài liệu này hướng dẫn tiêu chuẩn phát triển và các mẫu code để tạo, lập lịch tác vụ nền (background jobs) trong hệ thống HR Portal sử dụng Hangfire. Các job nghiệp vụ tuân thủ mô hình **Clean Architecture**, định nghĩa interface ở lớp Application và triển khai cụ thể ở lớp Infrastructure.

---

## 1. Nguyên tắc thiết kế tác vụ nền

Để hệ thống không bị phụ thuộc cứng (decouple):
1. **Không tham chiếu trực tiếp thư viện Hangfire trong các Handler của Application layer**. Hãy định nghĩa Service Interface và gọi qua Interface đó.
2. Cho phép sử dụng cú pháp tĩnh `BackgroundJob.Enqueue<IService>(x => x.ExecuteAsync(id))` trực tiếp trong các MediatR Handler nếu tham chiếu qua kiểu Interface. Hangfire sẽ tự động serialize biểu thức đó và lưu vào CSDL MySQL.
3. **Các tham số truyền vào Job bắt buộc là kiểu dữ liệu nguyên bản (primitive types)** như `int id`, `string key`, `DateTime time`. Tuyệt đối không truyền thực thể Entity hoặc DTO phức tạp (vì Hangfire serialize sang JSON sẽ bị phình to hoặc lỗi vòng lặp tham chiếu).
4. Logic xử lý trong Job phải đảm bảo tính **Idempotency** (chạy lại nhiều lần không sinh lỗi/trùng lặp dữ liệu) vì Hangfire có chế độ tự động chạy lại (retry) khi xảy ra lỗi kết nối mạng hoặc lỗi DB.

---

## 2. Các mẫu tác vụ nền tiêu biểu trong Tuyển dụng

Dưới đây là 3 loại tác vụ nền được thiết kế cho các nghiệp vụ chính của hệ thống.

### 2.1 Tác vụ chạy ngay lập tức (Fire-and-forget Jobs)
**Nghiệp vụ**: Gửi email xác nhận ứng tuyển thành công cho Ứng viên và thông báo hồ sơ mới cho Nhà tuyển dụng ngay khi ứng viên nộp đơn thành công, giúp API trả phản hồi nhanh cho Client mà không phải chờ Mail server phản hồi.

#### 1. Định nghĩa Interface
Trong `HR.Application/Common/Interfaces/IApplicationMailService.cs`:
```csharp
namespace HR.Application.Common.Interfaces;

public interface IApplicationMailService
{
    /// <summary>
    /// Gửi email thông báo nộp đơn ứng tuyển thành công
    /// </summary>
    Task SendApplicationConfirmationAsync(int applicationId, CancellationToken cancellationToken);
}
```

#### 2. Gọi Enqueue Job trong MediatR Handler
Trong `HR.Application.Applications.Commands.SubmitApplication.SubmitApplicationHandler.cs`:
```csharp
using Hangfire;
using HR.Application.Common.Interfaces;
using MediatR;

namespace HR.Application.Applications.Commands.SubmitApplication;

public class SubmitApplicationHandler : IRequestHandler<SubmitApplicationCommand, ApplicationDto>
{
    private readonly IApplicationRepository _repository;
    
    public SubmitApplicationHandler(IApplicationRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApplicationDto> Handle(SubmitApplicationCommand request, CancellationToken cancellationToken)
    {
        // 1. Thực hiện validate và lưu Đơn ứng tuyển vào CSDL
        var application = new Application { /* ... */ };
        await _repository.AddAsync(application, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        // 2. Đưa tác vụ gửi email vào hàng đợi Hangfire
        // Client nhận phản hồi ngay lập tức, việc gửi email sẽ được thực thi ngầm
        BackgroundJob.Enqueue<IApplicationMailService>(service => 
            service.SendApplicationConfirmationAsync(application.Id, CancellationToken.None));

        return application.Adapt<ApplicationDto>();
    }
}
```

---

### 2.2 Tác vụ hẹn giờ chạy (Delayed Jobs)
**Nghiệp vụ**: Tự động gửi email nhắc nhở lịch phỏng vấn cho cả Ứng viên và Nhà tuyển dụng trước thời gian phỏng vấn 2 tiếng.

#### 1. Định nghĩa Interface
Trong `HR.Application/Common/Interfaces/IInterviewReminderService.cs`:
```csharp
namespace HR.Application.Common.Interfaces;

public interface IInterviewReminderService
{
    /// <summary>
    /// Gửi email nhắc hẹn phỏng vấn
    /// </summary>
    Task SendReminderAsync(int interviewId, CancellationToken cancellationToken);
}
```

#### 2. Lập lịch gửi tin nhắc nhở (Schedule Job)
Trong Command Handler đặt lịch phỏng vấn:
```csharp
using Hangfire;
using HR.Application.Common.Interfaces;

namespace HR.Application.Interviews.Commands.ScheduleInterview;

public class ScheduleInterviewHandler
{
    public void ScheduleReminder(int interviewId, DateTime interviewStartTime)
    {
        // Nhắc nhở trước giờ phỏng vấn 2 tiếng
        var reminderTime = interviewStartTime.AddHours(-2);
        
        if (reminderTime > DateTime.Now)
        {
            // Đăng ký lịch chạy trễ với Hangfire
            BackgroundJob.Schedule<IInterviewReminderService>(service =>
                service.SendReminderAsync(interviewId, CancellationToken.None), 
                new DateTimeOffset(reminderTime));
        }
    }
}
```

---

### 2.3 Tác vụ chạy định kỳ (Cron / Recurring Jobs)
**Nghiệp vụ**:
1. Tự động quét và cập nhật các tin tuyển dụng hết hạn (`ExpiredAt < Now`) hàng ngày lúc 00:00.
2. Gửi email gợi ý việc làm phù hợp cho ứng viên vào sáng thứ Hai hàng tuần lúc 09:00.

#### 1. Định nghĩa Interface cho các Cron Jobs
Trong `HR.Application/Common/Interfaces/IJobExpiryService.cs`:
```csharp
namespace HR.Application.Common.Interfaces;

public interface IJobExpiryService
{
    Task CloseExpiredJobsAsync(CancellationToken cancellationToken);
}
```

Trong `HR.Application/Common/Interfaces/IJobRecommendationService.cs`:
```csharp
namespace HR.Application.Common.Interfaces;

public interface IJobRecommendationService
{
    Task SendWeeklyRecommendationsAsync(CancellationToken cancellationToken);
}
```

#### 2. Đăng ký chạy định kỳ trong Program.cs
Đăng ký các recurring jobs trong cấu hình startup hệ thống ở `HR.API/Program.cs` sau khi cấu hình Dashboard:
```csharp
// 1. Quét tin tuyển dụng hết hạn - Chạy hàng ngày vào lúc 00:00 sáng
RecurringJob.AddOrUpdate<IJobExpiryService>(
    "close-expired-jobs",
    service => service.CloseExpiredJobsAsync(CancellationToken.None),
    "0 0 * * *" // Hằng ngày lúc nửa đêm
);

// 2. Gửi gợi ý việc làm tuần mới - Chạy vào 09:00 sáng thứ Hai hàng tuần
RecurringJob.AddOrUpdate<IJobRecommendationService>(
    "weekly-job-recommendation",
    service => service.SendWeeklyRecommendationsAsync(CancellationToken.None),
    "0 9 * * 1" // 9h sáng thứ Hai (1 = Monday)
);
```

---

## 3. Checklist & Lưu ý khi viết Job

- [ ] Chỉ truyền kiểu dữ liệu nguyên bản (`int`, `string`, `Guid`) làm tham số.
- [ ] Logic nghiệp vụ trong Job phải kiểm tra trạng thái trước khi làm (Idempotent).
- [ ] Luôn sử dụng `CancellationToken.None` trong biểu thức Hangfire Lambda (Hangfire sẽ tự thay thế Token thực tế khi chạy).
- [ ] Các tác vụ gửi Email/SMS bắt buộc phải bắt ngoại lệ để tránh lỗi của bên thứ ba làm crash worker thread của Hangfire.
