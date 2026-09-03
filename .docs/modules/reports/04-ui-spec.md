# 04 — UI Specification: Reports & Analytics

> **Purpose**: Định nghĩa giao diện Dashboard, cấu trúc biểu đồ và tương tác hiển thị dữ liệu cho phân hệ Báo cáo & Thống kê.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `REP` |
| Feature folder | `src/app/features/reports/` |
| Route prefix | `/employer/dashboard` hoặc `/admin/dashboard` |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Page (Routes)

| ID | Route | Page Component | Mục đích | Quyền truy cập |
|----|-------|----------------|----------|----------------|
| PG-01 | `/employer/dashboard` | `EmployerDashboardPage` | Dashboard xem các chỉ số tuyển dụng | `report:view` (Employer) |
| PG-02 | `/admin/dashboard` | `AdminDashboardPage` | Dashboard thống kê tổng quan toàn sàn | `report:view_all` (Admin) |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 PG-01: `EmployerDashboardPage` (Báo cáo dành cho Doanh nghiệp)
- **Bố cục (Layout)**:
  - Phía trên cùng: Khung chọn khoảng ngày (DatePicker Range) lọc báo cáo [BR-01].
  - Khu vực KPI Cards (4 thẻ ngang):
    - Thẻ 1: Tin tuyển dụng đang hoạt động.
    - Thẻ 2: Tổng lượt xem tin (Views).
    - Thẻ 3: Tổng số hồ sơ nộp (Applications).
    - Thẻ 4: Tỉ lệ chuyển đổi ứng tuyển (Apply Rate %).
  - Khu vực Biểu đồ (Charts Row - chia 2 cột):
    - Cột trái: Biểu đồ phễu tuyển dụng (Funnel Chart) hiển thị tỷ lệ hao hụt qua các bước (Sơ tuyển -> Phỏng vấn -> Nhận việc).
    - Cột phải: Biểu đồ đường (Line Chart) biểu diễn lượt xem và lượt nộp hồ sơ theo từng ngày.
  - Phía dưới cùng: Bảng danh sách "Tin tuyển dụng thu hút nhiều hồ sơ nhất" (Top Job Postings).

---

### 3.2 PG-02: `AdminDashboardPage` (Báo cáo dành cho Admin)
- **Bố cục (Layout)**:
  - Panel lọc thời gian nhanh: 7 ngày qua, 30 ngày qua, Tháng này, Tùy chỉnh.
  - KPI Cards:
    - Thẻ 1: Tổng số Ứng viên mới đăng ký.
    - Thẻ 2: Tổng số Doanh nghiệp mới đăng ký.
    - Thẻ 3: Tổng số tin đăng chờ kiểm duyệt (Pending Jobs).
    - Thẻ 4: Tổng số đơn nộp ứng tuyển phát sinh.
  - Charts Row:
    - Biểu đồ cột (Bar Chart): So sánh số lượng đăng ký tài khoản mới giữa Candidate và Employer theo tháng.
    - Bảng thống kê "Doanh nghiệp đăng tuyển năng động nhất".
