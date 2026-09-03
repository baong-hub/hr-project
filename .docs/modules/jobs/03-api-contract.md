# 03 — API Contract: Jobs Management

> **Purpose**: Định nghĩa toàn bộ API của phân hệ Quản lý Tin tuyển dụng.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `JOB` |
| API base path | `/api/v1/jobs` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | POST | `/api/v1/jobs` | Đăng tin tuyển dụng mới | `job:post` | US-01 |
| EP-02 | GET | `/api/v1/jobs/{id}` | Xem thông tin chi tiết tin tuyển dụng | Public | US-04 |
| EP-03 | GET | `/api/v1/jobs` | Danh sách tin tuyển dụng (Phân trang & Lọc) | Public | US-02 |
| EP-04 | PUT | `/api/v1/jobs/{id}` | Cập nhật thông tin tin tuyển dụng | `job:manage` | US-01 |
| EP-05 | PATCH | `/api/v1/jobs/{id}/status` | Duyệt / Từ chối / Đóng tin | `job:moderate` hoặc `job:manage` | US-03 |
| EP-06 | DELETE | `/api/v1/jobs/{id}` | Xóa tin tuyển dụng (Soft delete) | `job:manage` | US-01 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Đăng tin tuyển dụng mới

**Method & Path**: `POST /api/v1/jobs`  
**Permission**: `job:post` (Yêu cầu vai trò EMPLOYER kích hoạt)  
**Tham chiếu**: US-01, [BR-01], [BR-02], [BR-03], [E-01]

**Request body** — `CreateJobDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `title` | `string` | Yes | Max 150 ký tự | Tiêu đề công việc |
| `description` | `string` | Yes | Không để trống | Mô tả công việc |
| `requirements` | `string` | Yes | Không để trống | Yêu cầu ứng viên |
| `benefits` | `string` | No | | Quyền lợi |
| `salaryFrom` | `decimal?` | No | `>= 0`, `<= salaryTo` [BR-01] | Lương tối thiểu |
| `salaryTo` | `decimal?` | No | `>= salaryFrom` [BR-01] | Lương tối đa |
| `city` | `string` | Yes | Max 50 ký tự | Thành phố tuyển dụng |
| `expiredAt` | `string` | Yes | Format DATE `YYYY-MM-DD`, [BR-02] | Hạn nộp hồ sơ |

**Response success** — `201 Created`  
Body: `ApiResponse<JobDto>`

---

### 3.2 EP-03: Tìm kiếm & Lọc tin tuyển dụng

**Method & Path**: `GET /api/v1/jobs`  
**Permission**: Public (Ứng viên & Khách tự do đều có thể gọi)  
**Tham chiếu**: US-02, [BR-04]

**Query Parameters**:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `page` | `int` | No | Trang số, mặc định = 1 |
| `pageSize` | `int` | No | Số tin mỗi trang, mặc định = 10 |
| `search` | `string` | No | Tìm theo tiêu đề, từ khóa |
| `filter[city]` | `string` | No | Lọc theo thành phố làm việc |
| `filter[salaryFrom]` | `decimal` | No | Lọc các tin có lương tối thiểu lớn hơn hoặc bằng |
| `filter[status]` | `string` | No | Lọc theo status (Chỉ Admin/Employer được dùng lọc status khác PUBLISHED) |

**Response success** — `200 OK`  
Body: `ApiResponse<JobDto[]>` kèm theo `meta` phân trang.

---

### 3.3 EP-05: Duyệt / Đổi trạng thái tin tuyển dụng

**Method & Path**: `PATCH /api/v1/jobs/{id}/status`  
**Permission**: `job:moderate` (Admin phê duyệt) hoặc `job:manage` (Doanh nghiệp tự đóng/mở tin)  
**Tham chiếu**: US-03, [BR-04]

**Request body** — `ChangeJobStatusDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `status` | `string` | Yes | Phù hợp với Role và quy tắc chuyển trạng thái | Trạng thái mới |
| `note` | `string?` | No | Bắt buộc khi từ chối tin đăng | Lý do từ chối |

**Response success** — `200 OK`  
Body: `ApiResponse<bool>` (Trả về true nếu cập nhật thành công).

---

## 4. DTO Models (Response Shapes)

### 4.1 `JobDto`
```typescript
export interface JobDto {
  id: number;
  employerId: number;
  companyName: string; // Map từ Employer
  companyLogoUrl?: string;
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  salaryFrom?: number;
  salaryTo?: number;
  city: string;
  status: string;
  expiredAt: string;
  createdAt: string;
}
```

---

## 5. Danh mục Mã lỗi nghiệp vụ

| HTTP Status | Error Code | Message | Giải thích |
|-------------|------------|---------|------------|
| 400 | `VALIDATION_FAILED` | Dữ liệu đầu vào không hợp lệ | Lọc sai, hạn nộp sai [BR-01], [BR-02] |
| 404 | `JOB_NOT_FOUND` | Không tìm thấy tin tuyển dụng yêu cầu | ID tin tuyển dụng không tồn tại hoặc đã bị xóa |
| 403 | `JOB_EMPLOYER_NOT_ACTIVE` | Tài khoản nhà tuyển dụng chưa kích hoạt | Tài khoản chưa được Admin duyệt [BR-03] |
| 403 | `JOB_FORBIDDEN_MODIFICATION` | Bạn không có quyền thao tác trên tin tuyển dụng này | Employer cố tình sửa tin của doanh nghiệp khác |
