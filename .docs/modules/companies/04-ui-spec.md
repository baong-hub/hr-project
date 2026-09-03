# 04 — UI Specification: Companies Management

> **Purpose**: Định nghĩa giao diện, các trang công khai và trang quản trị thông tin doanh nghiệp cho phân hệ Quản lý trang công ty & Thương hiệu doanh nghiệp.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `COM` |
| Feature folder | `src/app/features/companies/` |
| Route prefix | `/companies` hoặc `/employer/company` |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Page (Routes)

| ID | Route | Page Component | Mục đích | Quyền truy cập |
|----|-------|----------------|----------|----------------|
| PG-01 | `/companies` | `CompanyListPage` | Màn hình Ứng viên tìm kiếm, duyệt các công ty | Public |
| PG-02 | `/companies/:id` | `CompanyDetailPage` | Trang thông tin công khai (Thương hiệu & Tin tuyển dụng) | Public |
| PG-03 | `/employer/company/edit` | `CompanyEditPage` | Nhà tuyển dụng chỉnh sửa thông tin công ty | `company:update` |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 PG-01: `CompanyListPage` (Tìm kiếm công ty)
- **Bố cục (Layout)**:
  - Phía trên: Thanh tìm kiếm công ty theo tên.
  - Phía dưới: Lưới hiển thị danh sách các doanh nghiệp dạng Thẻ công ty (Company Card Grid):
    - Mỗi thẻ chứa: Logo công ty, Banner công ty (nhỏ), Tên công ty, Ngành nghề, Quy mô, Địa chỉ chính, Tổng số tin đang tuyển, Nút `Xem chi tiết`.

---

### 3.2 PG-02: `CompanyDetailPage` (Trang công ty công khai)
- **Bố cục (Layout)**:
  - **Khung Banner chính**: Banner lớn ở trên cùng. Đè lên banner góc trái dưới là Logo công ty.
  - **Khu vực Tên & Tương tác**:
    - Tên công ty (font-size: `--font-size-2xl`), Quy mô, Ngành nghề, Số lượt theo dõi.
    - Nút hành động: `Theo dõi công ty` (Nền xanh thương hiệu) [BR-03] và số tin đang mở tuyển dụng.
  - **Chia 2 tab nội dung chính**:
    - **Tab 1: Giới thiệu**: Hiển thị mô tả chi tiết công ty (HTML/Markdown), địa chỉ các chi nhánh và hình ảnh văn phòng.
    - **Tab 2: Tin tuyển dụng ({count})**: Hiển thị lưới việc làm đang tuyển dụng (Job Cards) của công ty này. Click vào việc làm mở trang chi tiết việc làm PG-02 của module `jobs`.

---

### 3.3 PG-03: `CompanyEditPage` (Doanh nghiệp sửa thông tin)
- **Bố cục (Layout)**:
  - Form dọc chia nhóm thông tin bằng các Card:
    - **Card 1: Hình ảnh thương hiệu**: Dropzone để chọn và tải lên Logo công ty và Ảnh bìa (Banner) [BR-02].
    - **Card 2: Thông tin chung**: Tên công ty, Quy mô nhân sự (Dropdown), Ngành nghề chính, Link Website.
    - **Card 3: Mô tả & Địa điểm**:
      - Mô tả chi tiết: Rich Text Editor.
      - Danh sách chi nhánh: Cho phép bấm `+ Thêm địa điểm` để nhập nhiều dòng địa chỉ.
  - Nút bấm chân trang: `Lưu thông tin trang` (Primary).
