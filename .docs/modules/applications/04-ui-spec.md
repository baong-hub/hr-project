# 04 — UI Specification: Job Applications

> **Purpose**: Định nghĩa giao diện quản lý đơn nộp và kịch bản tương tác cho phân hệ Ứng tuyển & Duyệt hồ sơ.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE_LIST_SCREEN.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `APP` |
| Feature folder | `src/app/features/applications/` |
| Route prefix | `/candidate/applications` hoặc `/employer/applications` |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Page (Routes)

| ID | Route | Page Component | Mục đích | Quyền truy cập |
|----|-------|----------------|----------|----------------|
| PG-01 | `/candidate/applications` | `CandidateAppHistoryPage` | Xem lịch sử ứng tuyển của Ứng viên | `job:apply` |
| PG-02 | `/employer/applications` | `EmployerAppManagePage` | Quản lý, sàng lọc đơn tuyển dụng | `job:manage` |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 PG-01: `CandidateAppHistoryPage` (Lịch sử ứng tuyển)
- **Bố cục (Layout)**:
  - Tiêu đề: "Lịch sử việc làm đã ứng tuyển".
  - Danh sách hiển thị dưới dạng bảng đơn giản hoặc card dọc:
    - Hiển thị: Logo doanh nghiệp, Tiêu đề việc làm, Mức lương đăng tuyển, Ngày nộp hồ sơ, Bản CV đã dùng nộp, Trạng thái hiện tại.
    - Cột Trạng thái sử dụng Badge với màu sắc trực quan (ví dụ: `SUBMITTED` - màu xanh dương nhạt, `REVIEWING` - màu xanh dương đậm, `SHORTLISTED` - màu vàng, `ACCEPTED` - màu xanh lá, `REJECTED` - màu đỏ).

---

### 3.2 PG-02: `EmployerAppManagePage` (Nhà tuyển dụng duyệt hồ sơ)
- **Bố cục (Layout)**: Tuân thủ cấu trúc của `STYLE_GUIDELINE_LIST_SCREEN.md`.
  - Khung lọc (Filter Panel):
    - Lọc theo Tin tuyển dụng (Dropdown chứa danh sách các tin đang hoạt động của công ty).
    - Lọc theo Trạng thái hồ sơ (Dropdown: Tất cả, Chờ duyệt, Đang xem xét, Sơ tuyển, Nhận việc, Từ chối).
  - Lưới dữ liệu (`<UiDataTable>`):
    - Cột hành động (⚙) Sticky Left: Nút Sửa trạng thái hồ sơ ✎, Phỏng vấn (Click chuyển sang đặt lịch phỏng vấn), Tải CV 📥.
    - Cột Mã hồ sơ (Link) -> Click hiển thị Panel xem nhanh hồ sơ ở bên phải (Drawer Panel).
    - Cột Họ và tên ứng viên.
    - Cột CV đính kèm (Link PDF).
    - Cột Ngày nộp.
    - Cột Trạng thái đơn nộp (Badge).

**Kịch bản tương tác (Interactions)**:
- Khi click chọn 1 ứng viên, Panel Drawer trượt ra từ bên phải hiển thị chi tiết: Họ tên, Email, SĐT, Thư xin việc (Cover Letter), Khung hiển thị PDF (PDF Viewer) trực tiếp của bản CV mà không cần tải xuống.
- Nút Sửa trạng thái (✎) hiển thị một Dropdown nhỏ cho phép cập nhật nhanh sang: Đang xem xét, Hẹn phỏng vấn, Từ chối, Nhận việc [BR-03].
