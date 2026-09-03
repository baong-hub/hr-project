# 03 — API Contract: CV & Profile Management

> **Purpose**: Định nghĩa toàn bộ API của phân hệ Quản lý Hồ sơ & CV.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `CV` |
| API base path | `/api/v1/candidates` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | PUT | `/api/v1/candidates/profile` | Cập nhật hồ sơ năng lực | `cv:manage` | US-01 |
| EP-02 | POST | `/api/v1/candidates/cvs` | Tải lên file CV (PDF) | `cv:manage` | US-02 |
| EP-03 | GET | `/api/v1/candidates/cvs` | Lấy danh sách CV của ứng viên | `cv:manage` | US-02 |
| EP-04 | PATCH | `/api/v1/candidates/cvs/{id}/main` | Đặt làm CV chính | `cv:manage` | US-02 |
| EP-05 | DELETE | `/api/v1/candidates/cvs/{id}` | Xóa CV | `cv:manage` | US-02 |
| EP-06 | GET | `/api/v1/candidates` | Tìm kiếm hồ sơ ứng viên | `cv:search` | US-03 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Cập nhật hồ sơ năng lực

**Method & Path**: `PUT /api/v1/candidates/profile`  
**Permission**: `cv:manage` (Chỉ ứng viên sở hữu tài khoản)  
**Tham chiếu**: US-01

**Request body** — `UpdateProfileDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `skills` | `string` | No | Max 500 ký tự | Chuỗi kỹ năng phân cách bằng dấu phẩy |
| `experienceSummary` | `string` | No | Max 4000 ký tự | Tóm tắt kinh nghiệm làm việc |
| `visibilityStatus` | `string` | Yes | PUBLIC hoặc PRIVATE | Trạng thái công khai hồ sơ |

**Response success** — `200 OK`  
Body: `ApiResponse<bool>`

---

### 3.2 EP-02: Tải lên file CV (PDF)

**Method & Path**: `POST /api/v1/candidates/cvs`  
**Content-Type**: `multipart/form-data`  
**Permission**: `cv:manage`  
**Tham chiếu**: US-02, [BR-01], [BR-02], [E-01]

**Request payload**:

| Part Name | Type | Required | Validation | Mô tả |
|-----------|------|----------|------------|-------|
| `cvTitle` | `string` | Yes | Max 100 ký tự | Tên đặt cho bản CV |
| `file` | `file` | Yes | Mime: `application/pdf`, size <= 5MB [BR-01] | File CV định dạng PDF |

**Business validation**:
- Đếm tổng số CV hiện tại của candidate: Nếu `>= 5` thì ném lỗi `CV_LIMIT_EXCEEDED` [BR-02].

**Response success** — `201 Created`  
Body: `ApiResponse<CandidateCvDto>`

---

### 3.3 EP-06: Tìm kiếm hồ sơ ứng viên (Dành cho Employer)

**Method & Path**: `GET /api/v1/candidates`  
**Permission**: `cv:search` (Nhà tuyển dụng)  
**Tham chiếu**: US-03, [BR-03]

**Query Parameters**:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `page` | `int` | No | Trang số, mặc định = 1 |
| `pageSize` | `int` | No | Kích thước trang, mặc định = 10 |
| `skill` | `string` | No | Lọc ứng viên có kỹ năng cụ thể |
| `search` | `string` | No | Tìm kiếm theo tên hoặc tóm tắt kinh nghiệm |

**Response success** — `200 OK`  
Body: `ApiResponse<CandidateProfileDto[]>`
- **Quy tắc hiển thị**: Hệ thống tự động lọc, chỉ hiển thị ứng viên có `visibilityStatus = PUBLIC` [BR-03].

---

## 4. Danh mục Mã lỗi nghiệp vụ

| HTTP Status | Error Code | Message | Giải thích |
|-------------|------------|---------|------------|
| 400 | `CV_FILE_TOO_LARGE` | Dung lượng file CV vượt quá 5MB | Dung lượng tệp tải lên quá giới hạn [BR-01] |
| 400 | `CV_INVALID_FORMAT` | Định dạng file không hợp lệ (Chỉ nhận PDF)| Sai kiểu file tải lên [BR-01] |
| 400 | `CV_LIMIT_EXCEEDED` | Bạn đã đạt giới hạn tối đa 5 bản CV | Vượt quá số lượng file cho phép [BR-02] |
| 404 | `CV_NOT_FOUND` | Bản CV yêu cầu không tồn tại | ID CV không khớp |
