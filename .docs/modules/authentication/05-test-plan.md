# 05 — Test Plan: Authentication & Authorization

> **Purpose**: Định nghĩa kịch bản kiểm thử (Test Cases) cho module Xác thực & Phân quyền.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `AUTH` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Logic Handlers, Validators, JWT generation | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API endpoints Đăng ký, Đăng nhập, Làm mới token | xUnit + WebApplicationFactory + Testcontainers MySQL |
| E2E / Manual | Luồng đăng ký ứng viên, đăng ký doanh nghiệp, login, redirect | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `RegisterCandidateHandler` & `RegisterEmployerHandler`
- **File**: `HR.UnitTests/Authentication/Commands/RegisterTests.cs`
- **Mocks**: `IUserRepository`, `ICurrentUserService`, `IDateTimeProvider`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenEmailExists_ShouldThrowConflict` | Email đăng ký đã tồn tại trong DB | Ném ngoại lệ `ConflictException` với mã lỗi `AUTH_EMAIL_ALREADY_EXISTS` [BR-01] |
| `Handle_WhenValidCandidateInput_ShouldCreateUser` | Input hợp lệ, đăng ký Ứng viên | Tạo bản ghi User trong DB có `Role = CANDIDATE`, `Status = ACTIVE`, băm mật khẩu thành công |
| `Handle_WhenValidEmployerInput_ShouldCreatePendingUser`| Input hợp lệ, đăng ký Nhà tuyển dụng | Tạo bản ghi User trong DB có `Role = EMPLOYER`, `Status = PENDING_APPROVAL` [BR-04] |

### 3.2 `RegisterCandidateValidator` & `RegisterEmployerValidator`

| Test Case | Input | Expected |
|-----------|-------|----------|
| `Validate_WhenEmailInvalid_ShouldHaveError` | `email = "invalidemail"` | Lỗi ở trường `Email` |
| `Validate_WhenPasswordWeak_ShouldHaveError` | `password = "123"` | Lỗi mật khẩu yếu [BR-02] |
| `Validate_WhenEmployerTaxCodeEmpty_ShouldHaveError`| `taxCode = ""` (Đăng ký Employer) | Lỗi trường `TaxCode` bắt buộc [BR-03] |

---

## 4. Integration Tests (Backend)

**Môi trường**: MySQL chạy trên Docker Testcontainers, EF Core Migrations được apply trước mỗi test run.

### 4.1 Endpoints kiểm thử chính
- `POST /api/v1/auth/register/candidate`
- `POST /api/v1/auth/login`

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `POST /register/candidate` | Truyền DTO hợp lệ | Trả về `201 Created`, CSDL có bản ghi mới |
| `POST /login` | Đúng email và mật khẩu | Trả về `200 OK`, có chứa `accessToken` và `refreshToken` |
| `POST /login` | Sai mật khẩu | Trả về `400 BadRequest`, mã lỗi `AUTH_INVALID_CREDENTIALS` |

---

## 5. E2E / Manual Test Checklist (Kiểm thử nghiệp vụ)

1. **Luồng Đăng ký & Đăng nhập Ứng viên**:
   - Truy cập `/auth/register/candidate`. Nhập thông tin, nhấn Đăng ký.
   - Kiểm tra xem hệ thống có tự động điều hướng sang `/auth/login` hoặc đăng nhập luôn.
   - Nhập thông tin vừa đăng ký tại trang Đăng nhập. Nhấn Đăng nhập.
   - Xác nhận chuyển hướng về màn hình tìm việc `/jobs`.

2. **Luồng Kiểm duyệt Nhà tuyển dụng**:
   - Đăng ký tài khoản Employer tại `/auth/register/employer`.
   - Đăng nhập bằng tài khoản Employer vừa tạo.
   - **Kỳ vọng**: Đăng nhập thành công nhưng trạng thái tài khoản là `PENDING_APPROVAL`. Thử gọi API đăng tin tuyển dụng (`POST /api/v1/jobs`) phải bị trả về `403 Forbidden` do tài khoản chưa kích hoạt [BR-04].
   - Dùng tài khoản Admin chuyển trạng thái Employer sang `ACTIVE`.
   - Gọi lại API đăng tin tuyển dụng. **Kỳ vọng**: Thành công.
