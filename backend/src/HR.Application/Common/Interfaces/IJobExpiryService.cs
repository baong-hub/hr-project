using System.Threading;
using System.Threading.Tasks;

namespace HR.Application.Common.Interfaces;

public interface IJobExpiryService
{
    /// <summary>
    /// Tự động quét và cập nhật trạng thái các tin tuyển dụng đã quá hạn sang EXPIRED
    /// </summary>
    Task<int> CloseExpiredJobsAsync(CancellationToken cancellationToken = default);
}
