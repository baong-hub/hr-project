# 05 — Test Plan: Reports & Analytics

> **Purpose**: Định nghĩa các kịch bản kiểm thử (Test Cases) cho phân hệ Báo cáo & Thống kê.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `REP` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Test Scope & Strategy

| Loại test | Phạm vi | Framework |
|-----------|---------|-----------|
| Unit (BE) | Logic tổng hợp số liệu, lọc dữ liệu theo khoảng ngày và quyền sở hữu | xUnit + FluentAssertions + NSubstitute |
| Integration (BE) | REST API trả về dữ liệu phễu, chỉ số tổng hợp của doanh nghiệp | xUnit + WebApplicationFactory + MySQL Testcontainers |
| E2E / Manual | Luồng đăng nhập Employer -> Xem Dashboard hiển thị biểu đồ và số lượng chính xác -> Xuất Excel số liệu khớp | Kiểm thử thủ công theo kịch bản |

---

## 3. Unit Tests (Backend)

### 3.1 `GetEmployerSummaryHandler`
- **File**: `HR.UnitTests/Reports/Queries/GetEmployerSummary/GetEmployerSummaryHandlerTests.cs`
- **Mocks**: `IReportRepository`, `ICurrentUserService`

| Test Method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenValidEmployer_ShouldReturnSummary` | Doanh nghiệp hoạt động có dữ liệu | Gọi Repo đếm số tin đăng và đơn nộp, trả về đúng số liệu tổng hợp |
| `Handle_ShouldEnforceEmployerDataIsolation` | `employerId = 5` đăng nhập truy vấn | Chỉ tính toán số liệu trên các bài đăng thuộc `employerId = 5`, tuyệt đối không tính lẫn dữ liệu công ty khác [BR-02] |

---

## 4. Integration Tests (Backend)

### 4.1 Endpoints kiểm thử
- `GET /api/v1/reports/employer/summary`
- `GET /api/v1/reports/employer/funnel`

| API Endpoint | Scenario | Expected |
|--------------|----------|----------|
| `GET /reports/employer/summary` | Gọi không truyền khoảng ngày | Trả về dữ liệu được tính mặc định cho 30 ngày gần nhất [BR-01] |
| `GET /reports/employer/summary` | Nhà tuyển dụng gọi thành công | Trả về mã `200 OK`, cấu trúc JSON chứa đầy đủ các chỉ số tổng hợp chính |

---

## 5. E2E / Manual Test Checklist (Luồng kiểm thử nghiệp vụ)

1. **Kiểm tra tính chính xác của số liệu Dashboard**:
   - Đăng nhập tài khoản Nhà tuyển dụng. Vào trang `/employer/applications` đếm số lượng hồ sơ hiện tại nộp vào công ty (ví dụ: 15 hồ sơ).
   - Vào trang `/employer/dashboard`.
   - **Kỳ vọng**: Thẻ "Tổng số hồ sơ nộp" hiển thị đúng con số 15.
   - Thử nộp thêm 1 hồ sơ mới từ tài khoản Ứng viên.
   - Quay lại Dashboard Doanh nghiệp, F5 reload. **Kỳ vọng**: Số lượng tăng lên 16.
   - Thay đổi bộ lọc khoảng ngày sang khoảng thời gian không có tin đăng nào. **Kỳ vọng**: Các chỉ số KPI chuyển về 0, biểu đồ hiển thị trạng thái trống (Empty State).
