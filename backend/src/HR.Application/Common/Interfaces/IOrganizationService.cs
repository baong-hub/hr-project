namespace HR.Application.Common.Interfaces;

public interface IOrganizationService
{
    /// <summary>
    /// Lấy toàn bộ danh sách UserId được phép xem dữ liệu của User chỉ định (bao gồm bản thân + nhân sự cấp dưới đệ quy + gán chéo).
    /// </summary>
    Task<List<int>> GetAllowedUserIdsAsync(int userId, CancellationToken cancellationToken = default);
}
