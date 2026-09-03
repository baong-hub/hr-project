# 04 — UI Specification: Authentication & Authorization

> **Purpose**: Định nghĩa giao diện, các luồng chuyển trang, cấu trúc Form và điều kiện kiểm thử dữ liệu đầu vào phía Client.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `AUTH` |
| Feature folder | `src/app/features/authentication/` |
| Route prefix | `/auth` |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Page (Routes)

| ID | Route | Page Component | Mục đích | Quyền truy cập |
|----|-------|----------------|----------|----------------|
| PG-01 | `/auth/login` | `LoginPage` | Màn hình đăng nhập | Public (Guest only) |
| PG-02 | `/auth/register/candidate` | `RegisterCandidatePage` | Đăng ký tài khoản ứng viên | Public (Guest only) |
| PG-03 | `/auth/register/employer` | `RegisterEmployerPage` | Đăng ký tài khoản doanh nghiệp | Public (Guest only) |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 PG-01: `LoginPage` (Màn hình đăng nhập)
- **Route**: `/auth/login`
- **User stories**: US-03
- **Bố cục (Layout)**:
  - Một khối card căn giữa màn hình (width 400px), nền trắng.
  - Logo ở trên, tiếp theo là tiêu đề "Đăng nhập hệ thống".
  - Một nút Tab đổi chế độ hoặc form chung.
  - Các input: Email (text), Mật khẩu (password).
  - Nút bấm: "Đăng nhập" (Primary, màu `--color-brand-primary`).
  - Dưới cùng có link điều hướng sang trang Đăng ký cho Ứng viên hoặc Doanh nghiệp.

**Validation phía Client (React Hook Form + Zod)**:
- `email`: Bắt buộc nhập, đúng định dạng email.
- `password`: Bắt buộc nhập, độ dài tối thiểu 6 ký tự.

---

### 3.2 PG-02: `RegisterCandidatePage` (Đăng ký tài khoản Ứng viên)
- **Route**: `/auth/register/candidate`
- **User stories**: US-01
- **Bố cục (Layout)**:
  - Giao diện Card (width 480px).
  - Tiêu đề: "Đăng ký tài khoản Ứng viên".
  - Các trường nhập liệu:
    - Họ và tên: Input text.
    - Email: Input text.
    - Mật khẩu: Input password.
    - Số điện thoại: Input text.
  - Nút bấm: "Đăng ký ngay" (Primary).
  - Link liên kết: "Đã có tài khoản? Đăng nhập ngay".

**Validation phía Client**:
- `fullName`: Bắt buộc, tối thiểu 2 ký tự.
- `email`: Bắt buộc, đúng định dạng email.
- `password`: Bắt buộc, tối thiểu 8 ký tự, chứa cả chữ hoa, chữ thường và chữ số [BR-02].
- `phoneNumber`: Bắt buộc, đúng định dạng số điện thoại (ví dụ: bắt đầu bằng 03, 05, 07, 08, 09 và gồm 10 số).

---

### 3.3 PG-03: `RegisterEmployerPage` (Đăng ký tài khoản Doanh nghiệp)
- **Route**: `/auth/register/employer`
- **User stories**: US-02
- **Bố cục (Layout)**:
  - Giao diện hai cột hoặc card lớn (width 600px).
  - Tiêu đề: "Đăng ký tài khoản Nhà tuyển dụng".
  - Nhóm thông tin tài khoản: Email, Mật khẩu, Số điện thoại.
  - Nhóm thông tin doanh nghiệp: Tên doanh nghiệp, Mã số thuế, Địa chỉ công ty.
  - Nút bấm: "Đăng ký Doanh nghiệp" (Primary).

**Validation phía Client**:
- `email`: Bắt buộc, định dạng email công ty.
- `password`: Bắt buộc, tối thiểu 8 ký tự, khớp [BR-02].
- `phoneNumber`: Bắt buộc, đúng định dạng điện thoại doanh nghiệp.
- `companyName`: Bắt buộc, tối thiểu 5 ký tự.
- `taxCode`: Bắt buộc, đúng định dạng mã số thuế (10 hoặc 13 chữ số) [BR-03].
- `address`: Bắt buộc nhập.

---

## 4. Flow chuyển hướng (Redirect Flow)
- Người dùng đã đăng nhập (đang giữ Access Token hợp lệ) cố gắng truy cập các trang `/auth/*` sẽ bị tự động redirect về trang chủ ứng dụng `/` hoặc trang Dashboard thích hợp:
  - Role `CANDIDATE` -> Redirect về `/jobs` (trang tìm việc).
  - Role `EMPLOYER` -> Redirect về `/employer/dashboard` (quản trị tin tuyển dụng).
  - Role `ADMIN` -> Redirect về `/admin/dashboard` (quản trị hệ thống).
