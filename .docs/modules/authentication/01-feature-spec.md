# 01 — Feature Specification: Authentication & Authorization

> **Purpose**: Mô tả yêu cầu nghiệp vụ của module Xác thực & Phân quyền (Authentication & Authorization).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `AUTH` |
| Module name | Authentication & Authorization |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Hệ thống cần cung cấp cổng truy cập riêng biệt cho 3 đối tượng người dùng: Ứng viên (tìm việc), Nhà tuyển dụng (đăng tuyển) và Quản trị viên (kiểm duyệt hệ thống). Cần một hệ thống xác thực an toàn, phân quyền chi tiết dựa trên vai trò (Role) và quyền hạn (Permission) để kiểm soát các chức năng và phạm vi truy cập dữ liệu của từng người dùng.

### 2.2 Mục tiêu module
- Cung cấp tính năng đăng ký tài khoản nhanh cho Ứng viên và đăng ký tài khoản doanh nghiệp cho Nhà tuyển dụng.
- Đăng nhập bảo mật sử dụng cơ chế Access Token (JWT) ngắn hạn và Refresh Token lưu trữ ở DB.
- Phân tách quyền truy cập dữ liệu (Data Isolation): Ứng viên chỉ thấy thông tin của mình; Nhà tuyển dụng chỉ thấy tin tuyển dụng và hồ sơ ứng tuyển nộp vào công ty mình; Admin quản lý toàn bộ.

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Ứng viên (CANDIDATE) | Tìm việc, nộp hồ sơ, quản lý CV cá nhân | Chỉ dữ liệu cá nhân của chính mình |
| Nhà tuyển dụng (EMPLOYER) | Đăng tuyển, duyệt hồ sơ ứng tuyển, đặt lịch phỏng vấn | Chỉ tin tuyển dụng & hồ sơ nộp vào công ty mình |
| Quản trị viên (ADMIN) | Kiểm duyệt doanh nghiệp, duyệt tin, quản lý tài khoản | Toàn bộ dữ liệu hệ thống |

---

## 3. User Stories

### US-01: Đăng ký tài khoản Ứng viên
**Story**: Là **Ứng viên**, tôi muốn **đăng ký tài khoản bằng email và mật khẩu** để **có thể tạo CV và nộp đơn ứng tuyển**.

**Acceptance Criteria**:
- **Given** Tôi ở trang Đăng ký và chọn loại tài khoản "Ứng viên".
- **When** Tôi nhập các trường: Họ tên, Email, Mật khẩu, Số điện thoại và nhấn "Đăng ký".
- **Then** Hệ thống kiểm tra định dạng email và kiểm tra trùng lặp. Nếu hợp lệ, hệ thống tạo tài khoản mới ở trạng thái hoạt động (`ACTIVE`) với vai trò `CANDIDATE` và gửi email chào mừng.

### US-02: Đăng ký tài khoản Nhà tuyển dụng
**Story**: Là **Nhà tuyển dụng (Employer)**, tôi muốn **đăng ký tài khoản bằng email và mật khẩu cùng các thông tin cá nhân và tên doanh nghiệp đại diện** để **hệ thống khởi tạo tài khoản và chuyển tiếp sang bước xác minh doanh nghiệp**.

**Acceptance Criteria**:
- **Given** Tôi ở trang Đăng ký và chọn loại tài khoản "Employer".
- **When** Tôi nhập các trường: Email, Mật khẩu, Họ tên (Full Name), Số điện thoại (Phone), Chức vụ (Position) và Tên doanh nghiệp (Company) [BR-03].
- **Then** Hệ thống tạo tài khoản mới ở trạng thái đăng ký (`REGISTERED`), kích hoạt job gửi email xác nhận.
- **When** Tôi xác thực email thành công.
- **Then** Trạng thái chuyển sang `EMAIL_VERIFIED`, sau đó hệ thống tự động khởi tạo bản ghi doanh nghiệp liên kết ở trạng thái `COMPANY_CREATED` và chuyển tiếp đến quy trình cung cấp hồ sơ doanh nghiệp phục vụ kiểm duyệt `COMPANY_VERIFICATION`.

### US-03: Đăng nhập hệ thống (JWT)
**Story**: Là **Người dùng**, tôi muốn **đăng nhập bằng email và mật khẩu** để **sử dụng các tính năng của hệ thống**.

**Acceptance Criteria**:
- **Given** Tôi đã có tài khoản và ở trang Đăng nhập.
- **When** Tôi nhập đúng Email, Mật khẩu và nhấn "Đăng nhập".
- **Then** Hệ thống tạo Access Token (hạn 15 phút, chứa vai trò chi tiết như CANDIDATE, COMPANY_OWNER, HR_MANAGER, RECRUITER, HIRING_MANAGER, hoặc ADMIN) và Refresh Token (hạn 7 ngày) trả về cho Client.

### US-04: Đăng xuất hệ thống
**Story**: Là **Người dùng**, tôi muốn **đăng xuất tài khoản** để **bảo vệ thông tin cá nhân trên thiết bị**.

**Acceptance Criteria**:
- **Given** Tôi đã đăng nhập và nhấn nút "Đăng xuất".
- **When** Client gửi Refresh Token lên API đăng xuất.
- **Then** Hệ thống vô hiệu hóa (revoke) Refresh Token đó trong CSDL và phản hồi thành công để Client xóa sạch session/token.

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | Email đăng ký là duy nhất toàn hệ thống, không được trùng lặp. | Đăng ký tài khoản |
| BR-02 | Mật khẩu bắt buộc có độ dài tối thiểu 8 ký tự, chứa cả chữ hoa, chữ thường và chữ số. | Đăng ký & Đổi mật khẩu |
| BR-03 | Khi đăng ký tài khoản Employer, hệ thống đồng thời tạo mới hoặc liên kết với thông tin doanh nghiệp (Company). | Đăng ký Employer |
| BR-04 | Nhà tuyển dụng chỉ được thực hiện đăng tuyển dụng và quản lý tuyển dụng khi Doanh nghiệp đạt trạng thái Đã xác minh (`VERIFIED`). | Đăng tin & Quản lý ATS |

