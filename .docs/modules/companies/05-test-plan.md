# 05 — Test Plan: Companies Management

> **Purpose**: Định nghĩa các kịch bản kiểm thử (Test Cases) cho phân hệ Quản lý trang công ty & Thương hiệu doanh nghiệp.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `COM` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Logic Cập nhật thông tin công ty, logic theo dõi doanh nghiệp | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API sửa thông tin, Tìm kiếm công ty, Thực hiện follow | xUnit + WebApplicationFactory + MySQL Testcontainers |
| E2E / Manual | Luồng Ứng viên đăng nhập -> Vào trang Công ty -> Bấm Theo dõi -> Số lượng follow tăng lên | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `UpdateCompanyHandler`
- **File**: `HR.UnitTests/Companies/Commands/UpdateCompany/UpdateCompanyHandlerTests.cs`
- **Mocks**: `ICompanyRepository`, `ICurrentUserService`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenUserNotBelongsToCompany_ShouldThrowForbidden` | Nhà tuyển dụng thuộc Company 2 sửa Company 1 | Ném ngoại lệ `ForbiddenException` với mã lỗi `COMPANY_FORBIDDEN_UPDATE` [BR-01] |
| `Handle_WhenValidInput_ShouldUpdateAndReturnCompany` | Input hợp lệ, thuộc doanh nghiệp | Lưu các trường mới vào CSDL thành công |

### 3.2 `UpdateCompanyValidator` (Validate định dạng hình ảnh)

| Test Case | Input | Expected |
|-----------|-------|----------|
| `Validate_WhenLogoSizeExceeds2MB_ShouldHaveError` | Logo tệp tin dung lượng 3MB | Lỗi trường Logo `CV_FILE_TOO_LARGE` [BR-02] (Re-use code/mã lỗi hoặc định nghĩa mới) |
| `Validate_WhenBannerNotImage_ShouldHaveError` | Banner tệp tin định dạng `.zip` | Lỗi định dạng không hợp lệ [BR-02] |

---

## 4. Integration Tests (Backend)

### 4.1 Endpoints kiểm thử
- `PUT /api/v1/companies/{id}`
- `POST /api/v1/companies/{id}/follow`

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `GET /api/v1/companies` | Tìm kiếm công ty theo tên | Trả về `200 OK`, danh sách chứa các công ty khớp từ khóa. |
| `POST /api/v1/companies/{id}/follow`| Ứng viên chưa đăng nhập bấm follow | Trả về `401 Unauthorized` [BR-03]. |
| `POST /api/v1/companies/{id}/follow`| Ứng viên đã đăng nhập bấm follow | Trả về `200 OK`, CSDL lưu đúng bản ghi `candidate_follows`. Gọi lại lần 2 thì hủy follow. |

---

## 5. E2E / Manual Test Checklist (Luồng kiểm thử nghiệp vụ)

1. **Kiểm tra nghiệp vụ Theo dõi Công ty**:
   - Đăng nhập tài khoản Ứng viên.
   - Tìm kiếm và vào trang chi tiết công ty "FPT Software" (PG-02).
   - Kiểm tra số lượng người theo dõi hiện tại (ví dụ: 120 followers).
   - Bấm nút "Theo dõi".
   - **Kỳ vọng**: Nút chuyển sang "Đang theo dõi" (màu xám nhạt/xanh), số lượng người theo dõi lập tức tăng lên 121.
   - Bấm lại nút "Đang theo dõi" một lần nữa.
   - **Kỳ vọng**: Trạng thái nút chuyển về "Theo dõi", số lượng giảm về 120.
