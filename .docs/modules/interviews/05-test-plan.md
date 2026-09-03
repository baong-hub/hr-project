# 05 — Test Plan: Interview Scheduling

> **Purpose**: Định nghĩa các kịch bản kiểm thử (Test Cases) cho phân hệ Lịch hẹn phỏng vấn.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `INT` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Logic Lên lịch, kiểm tra đơn nộp short-listed, tính toán múi giờ | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API tạo lịch, phản hồi lịch, hủy lịch phỏng vấn | xUnit + WebApplicationFactory + MySQL Testcontainers |
| E2E / Manual | Luồng Doanh nghiệp tạo lịch hẹn -> Ứng viên nhận thông báo và click Đồng ý -> Lịch chuyển sang Confirmed | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `ScheduleInterviewHandler`
- **File**: `HR.UnitTests/Interviews/Commands/ScheduleInterview/ScheduleInterviewHandlerTests.cs`
- **Mocks**: `IInterviewRepository`, `IApplicationRepository`, `IMailService`, `ICurrentUserService`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenStartTimeInPast_ShouldThrowValidation` | Truyền `startTime` nhỏ hơn thời điểm hiện tại | Ném ngoại lệ `ValidationException` với mã lỗi `VALIDATION_FAILED` [BR-01] |
| `Handle_WhenApplicationNotShortlisted_ShouldThrow` | Trạng thái đơn ứng tuyển là `SUBMITTED` (chưa sơ tuyển) | Ném ngoại lệ `BadRequestException` với mã lỗi `INTERVIEW_INVALID_APPLICATION_STATUS` [BR-02] |
| `Handle_WhenValidInput_ShouldCreatePendingInterview`| Đơn nộp đã sơ tuyển, thời gian hợp lệ | Tạo bản ghi lịch phỏng vấn trạng thái `PENDING`, gọi Hangfire gửi mail mời phỏng vấn ngay và tạo job nhắc nhở trước 2 tiếng [BR-03] |

---

## 4. Integration Tests (Backend)

### 4.1 Endpoints kiểm thử
- `POST /api/v1/interviews`
- `PATCH /api/v1/interviews/{id}/respond`

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `POST /api/v1/interviews` | Tạo lịch hẹn phỏng vấn | Trả về `201 Created`, trạng thái lưu vào DB là `PENDING`. |
| `PATCH /interviews/{id}/respond` | Ứng viên gửi phản hồi `accept = true` | Trả về `200 OK`, trạng thái cập nhật thành `CONFIRMED`. Gửi mail báo kết quả cho Employer. |
| `PATCH /interviews/{id}/respond` | Ứng viên phản hồi `accept = false` không kèm lý do | Trả về `400 BadRequest`, lỗi trường `Reason` bắt buộc. |

---

## 5. E2E / Manual Test Checklist (Luồng kiểm thử nghiệp vụ)

1. **Luồng kiểm tra quy trình phỏng vấn**:
   - Đăng nhập tài khoản Nhà tuyển dụng. Vào `/employer/applications`, click chọn đơn nộp của ứng viên Nguyễn Văn A.
   - Chuyển trạng thái đơn sang "Hẹn phỏng vấn" (`SHORTLISTED`).
   - Bấm nút "Lên lịch phỏng vấn". Điền thời gian (ngày mai lúc 09:00), hình thức Online, nhập link Zoom. Nhấn Xác nhận.
   - Đăng nhập tài khoản Ứng viên Nguyễn Văn A. Vào `/candidate/interviews`.
   - **Kỳ vọng**: Lịch phỏng vấn mới xuất hiện ở trạng thái "Chờ phản hồi".
   - Bấm nút "Đồng ý tham gia".
   - Đăng nhập lại tài khoản Nhà tuyển dụng, vào trang `/employer/interviews` (Calendar View).
   - **Kỳ vọng**: Lịch phỏng vấn của Nguyễn Văn A hiển thị màu xanh lá (Đã xác nhận).
   - Kiểm tra Mailbox của cả 2 bên. **Kỳ vọng**: Nhận được email thông báo chi tiết lịch kèm link Zoom.
   - Chờ đến 2 tiếng trước giờ phỏng vấn. **Kỳ vọng**: Job Hangfire được kích hoạt, cả 2 bên nhận được email nhắc nhở phỏng vấn.
