# 05 — Test Plan: CV & Profile Management

> **Purpose**: Định nghĩa các kịch bản kiểm thử (Test Cases) cho phân hệ Quản lý Hồ sơ & CV.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `CV` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Logic Upload CV, logic đổi CV chính, tóm tắt hồ sơ | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API Tải CV, set CV chính, Tìm kiếm hồ sơ ứng viên công khai | xUnit + WebApplicationFactory + MySQL Testcontainers |
| E2E / Manual | Luồng tải file PDF -> Đặt làm CV chính -> Đăng xuất/Đăng nhập -> Click xem thử CV PDF | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `UploadCvHandler`
- **File**: `HR.UnitTests/Cvs/Commands/UploadCv/UploadCvHandlerTests.cs`
- **Mocks**: `ICvRepository`, `IFileStorageService`, `ICurrentUserService`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenCvCountExceeds5_ShouldThrowConflict` | Ứng viên đã có sẵn 5 bản CV trong DB | Ném ngoại lệ `ValidationException` với mã lỗi `CV_LIMIT_EXCEEDED` [BR-02] |
| `Handle_WhenValidPdfFile_ShouldSaveToStorage` | File PDF dung lượng 2MB hợp lệ | Gọi `IFileStorageService.SaveAsync` và lưu bản ghi mới vào CSDL |
| `Handle_WhenFirstCvUploaded_ShouldSetAsMain` | Ứng viên chưa từng có CV nào | CV mới tải lên tự động được gán `is_main = 1` |

### 3.2 `UploadCvValidator` (Client & Server Validation)

| Test Case | Input | Expected |
|-----------|-------|----------|
| `Validate_WhenFileNotPdf_ShouldHaveError` | File hình ảnh `.png` hoặc `.docx` | Lỗi ở trường File `CV_INVALID_FORMAT` [BR-01] |
| `Validate_WhenFileSizeGreaterThan5MB_ShouldHaveError`| File PDF dung lượng 6MB | Lỗi dung lượng `CV_FILE_TOO_LARGE` [BR-01] |

---

## 4. Integration Tests (Backend)

### 4.1 Endpoints kiểm thử
- `POST /api/v1/candidates/cvs` (Tải CV)
- `GET /api/v1/candidates` (Tìm kiếm ứng viên)

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `GET /api/v1/candidates` | Nhà tuyển dụng gọi tìm kiếm ứng viên | Chỉ hiển thị các ứng viên có `visibility_status = PUBLIC` [BR-03]. Không hiển thị ứng viên để chế độ ẩn. |
| `PATCH /cvs/{id}/main` | Đặt một bản CV khác làm CV chính | Bản ghi được chọn chuyển `is_main = 1`, các bản ghi cũ của candidate đó chuyển `is_main = 0` [BR-02]. |

---

## 5. E2E / Manual Test Checklist (Luồng kiểm thử nghiệp vụ)

1. **Luồng tải CV & Đặt CV chính**:
   - Đăng nhập tài khoản Ứng viên. Vào trang `/candidate/cvs`.
   - Chọn tải lên một file hình ảnh `.jpg`. **Kỳ vọng**: Giao diện báo lỗi định dạng file [BR-01].
   - Chọn tải lên file PDF dung lượng 1MB. **Kỳ vọng**: Tải lên thành công, thẻ CV mới xuất hiện kèm badge "CV chính" (do là file đầu tiên).
   - Tải tiếp file PDF thứ hai. **Kỳ vọng**: Tải thành công, file mới không có badge "CV chính".
   - Click nút "Đặt làm CV chính" trên thẻ thứ hai. **Kỳ vọng**: Thẻ thứ hai chuyển sang có badge "CV chính", thẻ thứ nhất mất badge.
   - Tải liên tục cho đến file thứ 6. **Kỳ vọng**: Hệ thống báo lỗi giới hạn số lượng CV [BR-02].

2. **Luồng ẩn/hiện hồ sơ ứng viên**:
   - Đăng nhập tài khoản Ứng viên. Vào `/candidate/profile`, tắt nút gạt "Cho phép tìm kiếm hồ sơ" (`PRIVATE`).
   - Đăng nhập tài khoản Nhà tuyển dụng. Vào `/employer/candidates`, gõ tìm kiếm ứng viên đó. **Kỳ vọng**: Không tìm thấy.
   - Quay lại tài khoản Ứng viên, bật nút gạt thành `PUBLIC`.
   - Quay lại tài khoản Nhà tuyển dụng, tìm kiếm lại. **Kỳ vọng**: Tìm thấy ứng viên, xem được kỹ năng và tải được file CV chính.
