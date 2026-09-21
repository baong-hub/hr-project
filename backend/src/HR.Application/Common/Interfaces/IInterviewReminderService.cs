using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public interface IInterviewReminderService
{
    /// <summary>
    /// Quét các lịch phỏng vấn sắp diễn ra trong vòng 2 giờ tới và gửi email nhắc nhở cho ứng viên & nhà tuyển dụng
    /// </summary>
    Task<int> SendUpcomingInterviewRemindersAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gửi nhắc nhở cho một buổi phỏng vấn cụ thể
    /// </summary>
    Task<bool> SendReminderForInterviewAsync(int interviewId, CancellationToken cancellationToken = default);
}
