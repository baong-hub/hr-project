# 02 — Data Model: Authentication & Authorization

> **Purpose**: Thiết kế cơ sở dữ liệu và các thực thể (Entities) cho module Xác thực & Phân quyền.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `AUTH` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Sơ đồ ERD (high-level)

```
┌───────────────┐          ┌───────────────┐
│  candidates   │ 1      1 │     users     │ 1      N ┌─────────────────┐
│ (E-02)        │◀─────────┤ (E-01)        ├─────────▶│  refresh_tokens │
└───────────────┘          └───────┬───────┘          │  (E-06)         │
                                   │ N                └─────────────────┘
┌───────────────┐ 1      1         │
│  employers    │◀─────────────────┘
│ (E-03)        │
└───────────────┘
                                   
```

---

## 3. Danh sách Entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | User | `users` | Main | Tài khoản người dùng cơ sở |
| E-02 | Candidate | `candidates` | Ext | Thông tin chi tiết Ứng viên (nếu User là Candidate) |
| E-03 | Employer | `employers` | Ext | Thông tin chi tiết Doanh nghiệp (nếu User là Employer) |
| E-04 | Role | `roles` | System | Vai trò người dùng (CANDIDATE, EMPLOYER, ADMIN) |
| E-05 | Permission | `permissions` | System | Danh mục các quyền cụ thể |
| E-06 | RefreshToken | `refresh_tokens` | Token | Token quản lý phiên đăng nhập |

---

## 4. Chi tiết từng Entity

### 4.1 E-01: User (`users`)
**Mô tả**: Thông tin tài khoản đăng nhập chính của hệ thống.
**Tham chiếu**: [BR-01], [BR-02]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | PK |
| `email` | `VARCHAR(100)` | NO | — | Email đăng nhập | Unique, [BR-01] |
| `password_hash` | `VARCHAR(255)` | NO | — | Mật khẩu băm BCrypt/Argon2 | [BR-02] |
| `phone_number` | `VARCHAR(15)` | NO | — | Số điện thoại | |
| `role_id` | `INT UNSIGNED` | NO | — | Vai trò của tài khoản | FK -> `roles.id` |
| `status` | `VARCHAR(30)` | NO | `'ACTIVE'` | Trạng thái hoạt động | ACTIVE, PENDING_APPROVAL, BLOCKED |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

---

### 4.2 E-02: Candidate (`candidates`)
**Mô tả**: Thông tin chi tiết cá nhân của ứng viên.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | — | PK, đồng thời là FK | PK, FK -> `users.id` (1-1) |
| `full_name` | `VARCHAR(100)` | NO | — | Họ và tên ứng viên | |
| `avatar_url` | `VARCHAR(255)` | YES | NULL | Đường dẫn ảnh đại diện | |
| `birth_date` | `DATE` | YES | NULL | Ngày sinh | |
| `gender` | `VARCHAR(10)` | YES | NULL | Giới tính | MALE, FEMALE, OTHER |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

---

### 4.3 E-03: Employer (`employers`)
**Mô tả**: Thông tin liên kết nhân sự HR của doanh nghiệp.
**Tham chiếu**: [BR-03], [BR-04]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `user_id` | `INT UNSIGNED` | NO | — | FK liên kết tài khoản | FK -> `users.id` |
| `company_id` | `INT UNSIGNED` | NO | — | FK liên kết doanh nghiệp | FK -> `companies.id` |
| `position` | `VARCHAR(100)` | YES | NULL | Chức vụ trong công ty | |
| `role_in_company` | `VARCHAR(30)` | NO | `'RECRUITER'` | Vai trò HR (OWNER, HR_MANAGER, RECRUITER, HIRING_MANAGER) | |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

---

### 4.4 E-06: RefreshToken (`refresh_tokens`)
**Mô tả**: Quản lý phiên làm việc của người dùng, hỗ trợ tự động làm mới access token.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `user_id` | `INT UNSIGNED` | NO | — | Người sở hữu phiên | FK -> `users.id` |
| `token` | `VARCHAR(255)` | NO | — | Mã Refresh Token | Unique |
| `expires_at` | `DATETIME(6)` | NO | — | Thời gian hết hạn | |
| `is_revoked` | `TINYINT(1)` | NO | `0` | Trạng thái thu hồi | |
| `created_at` | `DATETIME(6)` | NO | — | Thời điểm tạo phiên | |
