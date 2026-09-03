# 04 — UI Specification: Jobs Management

> **Purpose**: Định nghĩa giao diện, các trang chức năng, bố cục biểu mẫu và kịch bản tương tác cho phân hệ Quản lý Tin tuyển dụng.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE_LIST_SCREEN.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `JOB` |
| Feature folder | `src/app/features/jobs/` |
| Route prefix | `/jobs` hoặc `/employer/jobs` |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Page (Routes)

| ID | Route | Page Component | Mục đích | Quyền truy cập |
|----|-------|----------------|----------|----------------|
| PG-01 | `/jobs` | `JobListPage` | Màn hình Ứng viên tìm kiếm tin tuyển dụng | Public |
| PG-02 | `/jobs/:id` | `JobDetailPage` | Xem chi tiết tin tuyển dụng | Public |
| PG-03 | `/employer/jobs` | `EmployerJobListPage` | Nhà tuyển dụng quản lý tin tuyển dụng | `job:manage` |
| PG-04 | `/employer/jobs/new` | `JobFormPage` | Đăng tin tuyển dụng mới | `job:post` |
| PG-05 | `/employer/jobs/:id/edit`| `JobFormPage` (tái sử dụng) | Sửa tin tuyển dụng | `job:manage` |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 PG-01: `JobListPage` (Ứng viên tìm việc)
- **Bố cục (Layout)**:
  - Thanh tìm kiếm lớn ở trên (Nhập từ khóa tuyển dụng, địa điểm, ngành nghề).
  - Phía dưới chia 2 phần: Bên trái là lưới hiển thị thẻ việc làm (Job Card Layout), bên phải là panel chi tiết nhanh (Quick View Panel) của tin được chọn.
  - Phân trang dạng Infinite Scroll hoặc Phân trang số truyền thống ở chân danh sách.

**Các trường lọc hỗ trợ**:
- Từ khóa: Nhập text.
- Địa điểm: Dropdown (Hà Nội, TP.HCM, Đà Nẵng, Khác).
- Mức lương: Dropdown (Dưới 10 triệu, 10-15 triệu, 15-20 triệu, Trên 20 triệu, Thỏa thuận).

---

### 3.2 PG-03: `EmployerJobListPage` (Quản lý tin đăng - Doanh nghiệp)
- **Bố cục (Layout)**: Tuân thủ chính xác mẫu màn hình danh sách nghiệp vụ tại `STYLE_GUIDELINE_LIST_SCREEN.md`.
  - Tiêu đề: "Quản lý tin tuyển dụng" kèm nút `+ Đăng tin mới` ở bên phải.
  - Lưới lọc: Từ khóa tìm kiếm, Trạng thái tin đăng, Hạn ứng tuyển.
  - Lưới dữ liệu (`<UiDataTable>`):
    - Cột Hành động (⚙): Sửa ✎ (PG-05), Đóng tin ✖, Xem hồ sơ nộp 👁. Cột này được cố định bên trái (Sticky).
    - Cột Mã tin (Link) -> Mở PG-02.
    - Cột Tiêu đề tin tuyển dụng.
    - Cột Mức lương (Căn phải).
    - Cột Ngày đăng & Hạn nộp (Căn phải).
    - Cột Số lượt nộp đơn (Click mở danh sách ứng tuyển).
    - Cột Trạng thái (Badge màu: Đang tuyển - xanh lá, Chờ duyệt - vàng, Hết hạn - xám).

---

### 3.3 PG-04: `JobFormPage` (Đăng/Sửa tin tuyển dụng)
- **Bố cục (Layout)**:
  - Form dọc chia nhóm thông tin bằng Card:
    - **Card 1: Thông tin chung**: Tiêu đề tin, Ngành nghề, Địa điểm làm việc, Số lượng tuyển.
    - **Card 2: Nội dung chi tiết**: Mô tả công việc (Rich Text), Yêu cầu ứng viên (Rich Text), Quyền lợi (Rich Text).
    - **Card 3: Chế độ đãi ngộ & Hạn nộp**: Lương tối thiểu, Lương tối đa (hoặc chọn checkbox "Thỏa thuận"), Hạn nộp hồ sơ (DatePicker).
  - Hàng nút lưu: `Lưu nháp` (Secondary), `Gửi duyệt & Đăng tin` (Primary, màu xanh thương hiệu).

**Validation phía Client**:
- Tiêu đề: Bắt buộc, 10-150 ký tự.
- Mô tả & Yêu cầu: Bắt buộc, tối thiểu 50 ký tự.
- Lương tối thiểu <= Lương tối đa (nếu cả hai được nhập) [BR-01].
- Hạn nộp hồ sơ: Lớn hơn hôm nay tối thiểu 7 ngày và tối đa 90 ngày [BR-02].
- Thành phố: Bắt buộc chọn.
