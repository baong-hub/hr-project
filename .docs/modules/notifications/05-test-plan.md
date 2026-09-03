# 05 — Test Plan: Notifications Management

> **Purpose**: Định nghĩa các kịch bản kiểm thử (Test Cases) cho phân hệ Trung tâm & Nhật ký thông báo.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `NOT` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Logic Đánh dấu đã đọc, đếm số lượng tin chưa đọc | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API thông báo, kết nối SignalR Hub push tin đăng | xUnit + WebApplicationFactory + SignalR Test Client |
| E2E / Manual | Luồng Đăng nhập -> Click chuông báo -> Xem tin -> Tin chuyển sang đã đọc -> Số lượng chuông báo giảm đi | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `MarkNotificationAsReadHandler`
- **File**: `HR.UnitTests/Notifications/Commands/MarkAsRead/MarkAsReadHandlerTests.cs`
- **Mocks**: `INotificationRepository`, `ICurrentUserService`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenNotificationNotExists_ShouldThrowNotFound` | Truyền ID thông báo sai | Ném ngoại lệ `NotFoundException` |
| `Handle_WhenUserNotOwnNotification_ShouldThrowForbidden` | User 2 cố ý đánh dấu đã đọc cho thông báo của User 1 | Ném ngoại lệ `ForbiddenException` [BR-01] |
| `Handle_WhenValidInput_ShouldMarkAsRead` | Input hợp lệ, chính chủ | Cập nhật `is_read = 1` trong DB thành công |

---

## 4. Integration Tests (Backend)

### 4.1 Endpoints kiểm thử
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}/read`

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `GET /notifications` | Gọi danh sách thông báo | Trả về `200 OK`, chỉ gồm các thông báo thuộc về `userId` hiện tại [BR-01]. |
| `GET /notifications/unread-count` | Kiểm tra đếm tin chưa đọc | Trả về đúng số lượng tin chưa đọc. Tốc độ truy vấn nhanh nhờ chỉ mục `idx_notifications_user_unread`. |

---

## 5. E2E / Manual Test Checklist (Luồng kiểm thử nghiệp vụ)

1. **Kiểm tra thông báo đẩy real-time (SignalR)**:
   - Mở hai cửa sổ trình duyệt:
     - Cửa sổ 1: Đăng nhập tài khoản Ứng viên Nguyễn Văn A.
     - Cửa sổ 2: Đăng nhập tài khoản Nhà tuyển dụng B.
   - Ứng viên Nguyễn Văn A đang xem trang chủ.
   - Ở Cửa sổ 2, Nhà tuyển dụng B duyệt hồ sơ ứng tuyển của Nguyễn Văn A và lên lịch hẹn phỏng vấn. Nhấn Xác nhận.
   - **Kỳ vọng**: 
     - Lập tức ở Cửa sổ 1, một popup toast thông báo mời phỏng vấn hiện lên góc màn hình.
     - Số lượng hiển thị trên biểu tượng quả chuông của Ứng viên tự động tăng lên 1 (ví dụ từ 0 lên 1) mà không cần reload trang [US-01], [BR-03].
     - Click vào quả chuông, click vào thông báo mới. **Kỳ vọng**: Popover đóng lại, số chuông giảm về 0, giao diện tự động navigate sang trang chi tiết phỏng vấn `/candidate/interviews` [US-02].
