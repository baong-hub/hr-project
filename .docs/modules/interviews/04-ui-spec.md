# 04 — UI Specification: Interview Scheduling

> **Purpose**: Định nghĩa giao diện quản lý lịch hẹn phỏng vấn và các tương tác lịch biểu cho phân hệ Lịch hẹn phỏng vấn.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `INT` |
| Feature folder | `src/app/features/interviews/` |
| Route prefix | `/employer/interviews` hoặc `/candidate/interviews` |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Page (Routes)

| ID | Route | Page Component | Mục đích | Quyền truy cập |
|----|-------|----------------|----------|----------------|
| PG-01 | `/employer/interviews` | `EmployerInterviewPage` | Xem lịch phỏng vấn dạng Lịch biểu (Calendar) của Doanh nghiệp | `interview:schedule` |
| PG-02 | `/candidate/interviews` | `CandidateInterviewPage` | Xem lịch phỏng vấn cá nhân của Ứng viên | `interview:respond` |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 PG-01: `EmployerInterviewPage` (Quản trị lịch hẹn - Doanh nghiệp)
- **Bố cục (Layout)**:
  - Header: Tiêu đề "Lịch hẹn phỏng vấn".
  - Bộ nút chuyển đổi View: Chế độ Lịch biểu (Calendar View) | Chế độ Danh sách (List View).
  - Khung chính hiển thị Calendar:
    - Bố cục lưới lịch tuần (Week View) hoặc lịch tháng (Month View).
    - Các mốc lịch hiển thị dưới dạng khối chữ nhật có màu nền tương ứng trạng thái (Chờ phản hồi - vàng, Đã xác nhận - xanh lá, Đã hủy - đỏ, Đã hoàn thành - tím).
  - Khi click vào 1 sự kiện trên lịch:
    - Mở một Popover / Modal hiển thị thông tin tóm tắt: Họ tên ứng viên, Vị trí tuyển dụng, Thời gian, Link họp trực tuyến, Ghi chú.
    - Nhóm nút thao tác: Hủy lịch (Click mở modal lý do hủy) | Hoàn thành phỏng vấn (Click đổi status sang `COMPLETED`).

---

### 3.2 PG-02: `CandidateInterviewPage` (Ứng viên quản lý lịch hẹn)
- **Bố cục (Layout)**:
  - Danh sách lịch hẹn phỏng vấn sắp tới (Upcoming Interviews) dạng lưới card:
    - Mỗi card hiển thị: Tên công ty, Vị trí ứng tuyển, Thời gian bắt đầu - kết thúc, Hình thức (Online/Offline), Địa điểm hoặc Link Meet.
    - **Nếu trạng thái lịch là `PENDING`**:
      - Hiển thị hai nút bấm lớn ở chân card:
        - `Đồng ý tham gia` (Primary, xanh lá thương hiệu).
        - `Từ chối lời mời` (Secondary, màu đỏ/xám).
        - Khi bấm từ chối, hiển thị input nhập Lý do từ chối (bắt buộc) trước khi gửi.
    - **Nếu trạng thái lịch đã được xác nhận (`CONFIRMED`)**:
      - Hiển thị nút "Tham gia phỏng vấn" (Dẫn trực tiếp sang link Zoom/Meet khi đến giờ phỏng vấn) hoặc chỉ dẫn địa chỉ.
