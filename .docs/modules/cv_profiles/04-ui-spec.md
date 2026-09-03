# 04 — UI Specification: CV & Profile Management

> **Purpose**: Định nghĩa giao diện, các trang quản trị hồ sơ và tương tác tải lên file cho phân hệ Quản lý Hồ sơ & CV.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `CV` |
| Feature folder | `src/app/features/cvs/` |
| Route prefix | `/candidate` hoặc `/employer/candidates` |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Page (Routes)

| ID | Route | Page Component | Mục đích | Quyền truy cập |
|----|-------|----------------|----------|----------------|
| PG-01 | `/candidate/profile` | `CandidateProfilePage` | Chỉnh sửa thông tin cá nhân & kỹ năng | `cv:manage` |
| PG-02 | `/candidate/cvs` | `CandidateCvPage` | Quản lý tải lên và danh sách file CV | `cv:manage` |
| PG-03 | `/employer/candidates` | `EmployerCandidateSearchPage`| Nhà tuyển dụng tìm kiếm hồ sơ ứng viên | `cv:search` |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 PG-02: `CandidateCvPage` (Ứng viên quản lý file CV)
- **Bố cục (Layout)**:
  - Chia làm 2 phần:
    - **Phía trên**: Khung thả tệp tin (File Dropzone Area) kèm ô nhập tiêu đề bản CV.
      - Nút hành động: `Tải lên CV` (Nền xanh lá thương hiệu).
    - **Phía dưới**: Danh sách các CV hiện có hiển thị dạng lưới thẻ (Card List):
      - Mỗi thẻ hiển thị: Icon PDF, Tiêu đề CV, Kích thước tệp, Ngày tải lên.
      - Trạng thái CV chính: Badge "CV chính" (Xanh lá).
      - Nhóm nút thao tác trên thẻ: Đặt làm CV chính (Ẩn nếu đã là CV chính) | Xem file 👁 | Xóa 🗑.

**Tương tác (Interactions)**:
- Kéo thả file PDF vào Dropzone, hệ thống kiểm tra định dạng và dung lượng tại client trước khi gọi API EP-02.
- Nút Xóa CV bắt buộc mở Modal xác nhận và gọi API EP-05 khi đồng ý.

---

### 3.2 PG-01: `CandidateProfilePage` (Chỉnh sửa hồ sơ)
- **Bố cục (Layout)**:
  - Form chia thành 3 Card lớn:
    - **Card 1: Thông tin cá nhân cơ bản**: Avatar, Họ tên, Ngày sinh, Giới tính, Số điện thoại.
    - **Card 2: Năng lực & Kinh nghiệm**:
      - Ô nhập Kỹ năng: Dạng thẻ tag tự động thêm khi gõ dấu phẩy hoặc enter.
      - Tóm tắt kinh nghiệm: Ô nhập văn bản dạng textarea có hiển thị bộ đếm số ký tự (tối đa 4000).
    - **Card 3: Trạng thái tìm việc (Visibility)**:
      - Nút gạt Switch Toggle: "Bật chế độ cho phép Nhà tuyển dụng tìm kiếm hồ sơ".
      - Text mô tả chi tiết: Giải thích quyền lợi khi bật/ẩn thông tin.
  - Nút bấm chân trang: `Lưu thay đổi` (Primary).

---

### 3.3 PG-03: `EmployerCandidateSearchPage` (Nhà tuyển dụng tìm hồ sơ)
- **Bố cục (Layout)**: Tuân thủ màn hình dạng lưới (List screen pattern).
  - Khung lọc: Tìm từ khóa kỹ năng, vị trí công việc, địa điểm sinh sống.
  - Lưới kết quả: Hiển thị các ứng viên ở trạng thái `PUBLIC` [BR-03].
  - Mỗi bản ghi ứng viên: Hiển thị Họ tên, Kỹ năng dưới dạng tag, Tóm tắt kinh nghiệm (cắt gọn text), Nút `Xem CV` và `Liên hệ`.
