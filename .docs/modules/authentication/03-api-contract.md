# 03 — API Contract: Authentication & Authorization

> **Purpose**: Định nghĩa toàn bộ API của module Xác thực & Phân quyền.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `AUTH` |
| API base path | `/api/v1/auth` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | POST | `/api/v1/auth/register/candidate` | Đăng ký tài khoản Ứng viên | Public | US-01 |
| EP-02 | POST | `/api/v1/auth/register/employer` | Đăng ký tài khoản Nhà tuyển dụng | Public | US-02 |
| EP-03 | POST | `/api/v1/auth/login` | Đăng nhập hệ thống | Public | US-03 |
| EP-04 | POST | `/api/v1/auth/refresh` | Làm mới access token | Public | US-03 |
| EP-05 | POST | `/api/v1/auth/logout` | Đăng xuất hệ thống | `[Authorize]` | US-04 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Đăng ký tài khoản Ứng viên

**Method & Path**: `POST /api/v1/auth/register/candidate`  
**Permission**: Public (Không yêu cầu đăng nhập)  
**Tham chiếu**: US-01, [BR-01], [BR-02], [E-01], [E-02]

**Request body** — `RegisterCandidateDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `email` | `string` | Yes | Format email, max 100 ký tự | Email đăng ký |
| `password` | `string` | Yes | Độ dài từ 8-50 ký tự, [BR-02] | Mật khẩu tài khoản |
| `phoneNumber` | `string` | Yes | Định dạng số điện thoại Việt Nam | Số điện thoại liên hệ |
| `fullName` | `string` | Yes | Max 100 ký tự | Họ và tên ứng viên |

**Response success** — `201 Created`  
Body: `ApiResponse<UserDto>`

---

### 3.2 EP-02: Đăng ký tài khoản Nhà tuyển dụng

**Method & Path**: `POST /api/v1/auth/register/employer`  
**Permission**: Public (Không yêu cầu đăng nhập)  
**Tham chiếu**: US-02, [BR-01], [BR-02], [BR-03], [E-01], [E-03]

**Request body** — `RegisterEmployerDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `email` | `string` | Yes | Format email, max 100 ký tự | Email đăng ký |
| `password` | `string` | Yes | Độ dài từ 8-50 ký tự, [BR-02] | Mật khẩu tài khoản |
| `fullName` | `string` | Yes | Max 100 ký tự | Họ tên nhà tuyển dụng |
| `phoneNumber` | `string` | Yes | Định dạng số điện thoại Việt Nam | Số điện thoại liên hệ |
| `position` | `string` | Yes | Max 100 ký tự | Chức vụ (ví dụ: HR Manager...) |
| `companyName` | `string` | Yes | Max 150 ký tự | Tên doanh nghiệp đại diện |

**Response success** — `201 Created`  
Body: `ApiResponse<UserDto>`

---

### 3.3 EP-03: Đăng nhập hệ thống

**Method & Path**: `POST /api/v1/auth/login`  
**Permission**: Public  
**Tham chiếu**: US-03, [E-01]

**Request body** — `LoginDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `email` | `string` | Yes | Format email | Email đăng nhập |
| `password` | `string` | Yes | Không được để trống | Mật khẩu đăng nhập |

**Response success** — `200 OK`  
Body: `ApiResponse<LoginResultDto>`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "d7b93a0b-12a...",
    "user": {
      "id": 1,
      "email": "candidate@example.com",
      "role": "CANDIDATE",
      "permissions": ["job:search", "job:apply", "cv:manage"]
    }
  },
  "error": null
}
```

---

## 4. DTO Models (Response Shapes)

### 4.1 `UserDto`
```typescript
export interface UserDto {
  id: number;
  email: string;
  role: string;
  status: string;
}
```

---

## 5. Danh mục Mã lỗi nghiệp vụ

| HTTP Status | Error Code | Message | Giải thích |
|-------------|------------|---------|------------|
| 400 | `VALIDATION_FAILED` | Dữ liệu đầu vào không hợp lệ | Lỗi do Client truyền thiếu hoặc sai định dạng trường bắt buộc |
| 409 | `AUTH_EMAIL_ALREADY_EXISTS` | Email đã được sử dụng trên hệ thống | Trùng email đăng ký [BR-01] |
| 400 | `AUTH_INVALID_CREDENTIALS` | Email hoặc mật khẩu không chính xác | Lỗi sai thông tin đăng nhập |
| 403 | `AUTH_ACCOUNT_BLOCKED` | Tài khoản đã bị khóa bởi quản trị viên | Người dùng bị block không đăng nhập được |
| 401 | `AUTH_INVALID_REFRESH_TOKEN`| Refresh Token không hợp lệ hoặc đã hết hạn | Token làm mới hết hiệu lực |
