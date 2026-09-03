# 05 — Test Plan: Job Applications

> **Purpose**: Định nghĩa các kịch bản kiểm thử (Test Cases) cho phân hệ Ứng tuyển & Duyệt hồ sơ.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `APP` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Logic Nộp đơn, kiểm tra trùng lặp, logic chuyển trạng thái đơn hàng | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API ứng tuyển, thay đổi trạng thái, lọc theo tin tuyển dụng | xUnit + WebApplicationFactory + MySQL Testcontainers |
| E2E / Manual | Luồng ứng viên nộp đơn -> Nhà tuyển dụng nhận được thông báo email -> Đổi trạng thái -> Ứng viên nhận mail cập nhật | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `SubmitApplicationHandler`
- **File**: `HR.UnitTests/Applications/Commands/SubmitApplication/SubmitApplicationHandlerTests.cs`
- **Mocks**: `IApplicationRepository`, `IJobRepository`, `ICurrentUserService`, `IMailService`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenAlreadyApplied_ShouldThrowConflict` | Ứng viên đã nộp đơn cho tin đăng này trước đó | Ném ngoại lệ `ConflictException` với mã lỗi `APPLICATION_ALREADY_SUBMITTED` [BR-01] |
| `Handle_WhenJobClosedOrExpired_ShouldThrowBadRequest`| Tin tuyển dụng đã quá hạn hoặc bị đóng | Ném ngoại lệ `BadRequestException` với mã lỗi `JOB_NOT_ACTIVE` [BR-02] |
| `Handle_WhenValidInput_ShouldCreateApplication` | Hồ sơ hợp lệ, tin đăng hoạt động | Lưu bản ghi đơn nộp mới ở trạng thái `SUBMITTED`, gọi Hangfire enqueue job gửi email [BR-04] |

### 3.2 Logic chuyển đổi trạng thái đơn ứng tuyển

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `ChangeStatus_FromAcceptedToRejected_ShouldThrow` | Đơn nộp đang ở trạng thái `ACCEPTED` | Ném ngoại lệ `ValidationException` với mã lỗi `APPLICATION_STATUS_FINAL` [BR-03] |
| `ChangeStatus_FromSubmittedToReviewing_ShouldSucceed`| Đổi từ `SUBMITTED` sang `REVIEWING` | Trạng thái được cập nhật thành công |

---

## 4. Integration Tests (Backend)

### 4.1 Endpoints kiểm thử
- `POST /api/v1/applications`
- `PATCH /api/v1/applications/{id}/status`

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `POST /api/v1/applications` | Nộp đơn ứng tuyển | Trả về `201 Created`, CSDL lưu đúng `job_id`, `candidate_id` và `candidate_cv_id` |
| `PATCH /applications/{id}/status`| Nhà tuyển dụng sở hữu tin tuyển dụng gọi cập nhật | Trả về `200 OK`, trạng thái được lưu thành công vào CSDL. |
| `PATCH /applications/{id}/status`| Nhà tuyển dụng khác cố gắng gọi cập nhật | Trả về `403 Forbidden` (do không sở hữu tin đăng). |

---

## 5. E2E / Manual Test Checklist (Luồng kiểm thử nghiệp vụ)

1. **Kiểm tra nghiệp vụ nộp đơn trùng lặp**:
   - Đăng nhập tài khoản Ứng viên. Chọn tin tuyển dụng "Senior .NET Developer".
   - Bấm Ứng tuyển, chọn CV và nộp đơn. **Kỳ vọng**: Thành công.
   - Tiếp tục ở trang tin đó, bấm nút Ứng tuyển lại. **Kỳ vọng**: Nút ứng tuyển bị disabled hoặc hệ thống báo lỗi không cho phép nộp trùng [BR-01].

2. **Kiểm tra nghiệp vụ hạn nộp**:
   - Chờ một tin tuyển dụng hết hạn (hoặc Admin đóng tin tuyển dụng).
   - Dùng tài khoản Ứng viên cố tình gọi API nộp hồ sơ bằng Postman gửi đến `job_id` của tin đăng đã hết hạn.
   - **Kỳ vọng**: API trả về `400 BadRequest`, mã lỗi `JOB_NOT_ACTIVE` [BR-02].
