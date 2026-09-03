# 05 — Test Plan: Saved Jobs & Interactions

> **Purpose**: Định nghĩa các kịch bản kiểm thử (Test Cases) cho phân hệ Việc làm đã lưu & Tương tác.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `SAV` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Logic Toggle lưu/hủy lưu việc làm, validate người dùng đăng nhập | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API toggle save, lấy danh sách việc làm đã lưu | xUnit + WebApplicationFactory + MySQL Testcontainers |
| E2E / Manual | Luồng Ứng viên click lưu từ Job Detail -> Kiểm tra mục Saved Jobs hiển thị đúng tin tuyển dụng -> Click hủy lưu | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `ToggleSaveJobHandler`
- **File**: `HR.UnitTests/SavedJobs/Commands/ToggleSaveJob/ToggleSaveJobHandlerTests.cs`
- **Mocks**: `ISavedJobRepository`, `IJobRepository`, `ICurrentUserService`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenUserNotCandidate_ShouldThrowForbidden` | Employer cố gắng gọi API lưu việc làm | Ném ngoại lệ `ForbiddenException` [BR-01] |
| `Handle_WhenJobNotSaved_ShouldSaveJob` | Tin tuyển dụng chưa từng lưu | Thêm bản ghi mới vào DB, trả về `isSaved = true` |
| `Handle_WhenJobAlreadySaved_ShouldUnsaveJob` | Tin tuyển dụng đã được lưu từ trước | Xóa bản ghi khỏi DB, trả về `isSaved = false` |

---

## 4. Integration Tests (Backend)

### 4.1 Endpoints kiểm thử
- `POST /api/v1/jobs/{id}/save`
- `GET /api/v1/jobs/saved`

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `POST /jobs/{id}/save` | Gọi lưu tin tuyển dụng không tồn tại | Trả về `404 NotFound`. |
| `GET /jobs/saved` | Lấy danh sách việc làm đã lưu có chứa tin hết hạn | Trả về `200 OK`, bản ghi tin hết hạn có `jobStatus = "EXPIRED"` [BR-02]. |

---

## 5. E2E / Manual Test Checklist (Luồng kiểm thử nghiệp vụ)

1. **Kiểm tra luồng Lưu & Hủy lưu tin đăng**:
   - Đăng nhập tài khoản Ứng viên.
   - Tìm kiếm công việc "Senior .NET Developer" ở trang danh sách việc làm.
   - Bấm vào biểu tượng bookmark trên thẻ việc làm.
   - **Kỳ vọng**: Biểu tượng đổi màu sang xanh lá.
   - Truy cập trang `/candidate/saved-jobs` (PG-01).
   - **Kỳ vọng**: Công việc "Senior .NET Developer" hiển thị trong danh sách.
   - Bấm nút bookmark màu xanh trên thẻ việc làm tại trang việc làm đã lưu.
   - **Kỳ vọng**: Thẻ biến mất khỏi danh sách. Quay lại trang danh sách việc làm ngoài trang chủ, biểu tượng bookmark của tin đó chuyển về trạng thái chưa lưu.
