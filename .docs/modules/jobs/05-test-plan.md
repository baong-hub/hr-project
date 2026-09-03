# 05 — Test Plan: Jobs Management

> **Purpose**: Định nghĩa các kịch bản kiểm thử (Test Cases) cho phân hệ Quản lý Tin tuyển dụng.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `JOB` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Command/Query Handlers, DTO Validators, Job status transitions | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API Đăng tin, duyệt tin, tìm việc làm, Soft delete | xUnit + WebApplicationFactory + MySQL Testcontainers |
| E2E / Manual | Quy trình Đăng tin -> Chờ duyệt -> Phê duyệt -> Hiển thị trên JobList của Ứng viên | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `CreateJobHandler`
- **File**: `HR.UnitTests/Jobs/Commands/CreateJob/CreateJobHandlerTests.cs`
- **Mocks**: `IJobRepository`, `ICurrentUserService`, `IDateTimeProvider`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenEmployerNotActive_ShouldThrowForbidden` | Doanh nghiệp có status != `ACTIVE` | Ném ngoại lệ `ForbiddenException` với mã lỗi `JOB_EMPLOYER_NOT_ACTIVE` [BR-03] |
| `Handle_WhenValidInput_ShouldCreatePendingJob` | Đầu vào hợp lệ, tài khoản kích hoạt | Gọi Repo.AddAsync lưu tin đăng mới ở trạng thái `PENDING` (Chờ duyệt) |
| `Handle_ShouldSetAuditFields` | Đăng tin thành công | Lưu thông tin người tạo (`CreatedBy`), thời gian tạo (`CreatedAt`), và `EmployerId` của user hiện tại |

### 3.2 `CreateJobValidator` (Kiểm thử định dạng đầu vào)

| Test Case | Input | Expected |
|-----------|-------|----------|
| `Validate_WhenSalaryMinGreaterThanMax_ShouldHaveError` | `salaryFrom = 25.000.000`, `salaryTo = 20.000.000` | Lỗi ở trường `SalaryFrom` [BR-01] |
| `Validate_WhenExpiredAtTooShort_ShouldHaveError` | `expiredAt = DateTime.Today.AddDays(5)` | Lỗi hạn nộp quá ngắn (phải >= 7 ngày) [BR-02] |
| `Validate_WhenExpiredAtTooLong_ShouldHaveError` | `expiredAt = DateTime.Today.AddDays(95)` | Lỗi hạn nộp quá dài (phải <= 90 ngày) [BR-02] |
| `Validate_WhenTitleEmpty_ShouldHaveError` | `title = ""` | Lỗi bắt buộc nhập tiêu đề |

---

## 4. Integration Tests (Backend)

### 4.1 Endpoints kiểm thử
- `POST /api/v1/jobs`
- `GET /api/v1/jobs`

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `POST /api/v1/jobs` | Đăng tin với quyền EMPLOYER hoạt động | Trả về `210 Created`, tin ở trạng thái `PENDING` |
| `GET /api/v1/jobs` | Ứng viên gọi tìm kiếm việc làm | Chỉ hiển thị các tin đăng có `status = PUBLISHED` và `expired_at >= Today` [BR-04]. Không hiển thị tin của các công ty bị block. |

---

## 5. E2E / Manual Test Checklist (Luồng duyệt tin đăng)

1. **Luồng Đăng & Phê duyệt Tin**:
   - Dùng tài khoản Nhà tuyển dụng đã duyệt (`ACTIVE`), truy cập `/employer/jobs/new`.
   - Điền đầy đủ thông tin tin tuyển dụng, nhấn Đăng tuyển.
   - Kiểm tra trang `/employer/jobs`: Tin tuyển dụng mới xuất hiện ở trạng thái "Chờ duyệt" (`PENDING`).
   - Dùng tài khoản Ứng viên truy cập `/jobs`: Tìm kiếm tin tuyển dụng đó. **Kỳ vọng**: Không thấy xuất hiện (do chưa được duyệt) [BR-04].
   - Dùng tài khoản Admin truy cập trang Kiểm duyệt tin. Nhấp phê duyệt tin tuyển dụng trên.
   - Quay lại tài khoản Ứng viên và tìm kiếm lại. **Kỳ vọng**: Tin tuyển dụng hiển thị đầy đủ, đúng thông tin.
   - Quay lại tài khoản Nhà tuyển dụng: Tin tuyển dụng chuyển sang trạng thái "Đang tuyển" (`PUBLISHED`).
