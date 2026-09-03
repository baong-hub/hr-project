# 03 — API Contract: Companies Management

> **Purpose**: Định nghĩa toàn bộ các endpoint API cho phân hệ Quản lý trang công ty & Thương hiệu doanh nghiệp.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `COM` |
| API base path | `/api/v1/companies` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | PUT | `/api/v1/companies/{id}` | Cập nhật thông tin công ty | `company:update` | US-01 |
| EP-02 | GET | `/api/v1/companies/{id}` | Lấy thông tin chi tiết một công ty | Public | US-02 |
| EP-03 | GET | `/api/v1/companies` | Tìm kiếm & lọc danh sách công ty | Public | US-02 |
| EP-04 | POST | `/api/v1/companies/{id}/follow` | Theo dõi / Hủy theo dõi công ty | `job:save` | US-03 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Cập nhật thông tin công ty

**Method & Path**: `PUT /api/v1/companies/{id}`  
**Permission**: `company:update` (Chỉ Nhà tuyển dụng thuộc công ty đó hoặc Admin được quyền gọi)  
**Tham chiếu**: US-01, [BR-01], [BR-02], [E-01]

**Request body** — `UpdateCompanyDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `name` | `string` | Yes | Max 150 ký tự | Tên công ty |
| `logoUrl` | `string` | No | | Đường dẫn Logo (upload riêng) [BR-02] |
| `bannerUrl` | `string` | No | | Đường dẫn Banner [BR-02] |
| `description` | `string` | No | | Mô tả chi tiết |
| `website` | `string` | No | Format URL | Link website |
| `sizeRange` | `string` | Yes | Không để trống | Quy mô nhân sự |
| `industry` | `string` | Yes | Không để trống | Ngành nghề |
| `addressList` | `string` | Yes | Không để trống | Danh sách địa chỉ |

**Response success** — `200 OK`  
Body: `ApiResponse<CompanyDto>`

---

### 3.2 EP-03: Tìm kiếm & Lọc danh sách công ty

**Method & Path**: `GET /api/v1/companies`  
**Permission**: Public  
**Tham chiếu**: US-02

**Query Parameters**:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `page` | `int` | No | Trang số, mặc định = 1 |
| `pageSize` | `int` | No | Kích thước trang, mặc định = 10 |
| `search` | `string` | No | Tìm theo tên công ty |
| `industry` | `string` | No | Lọc theo ngành nghề |

**Response success** — `200 OK`  
Body: `ApiResponse<CompanyDto[]>` kèm theo metadata phân trang.

---

### 3.3 EP-04: Theo dõi công ty

**Method & Path**: `POST /api/v1/companies/{id}/follow`  
**Permission**: `job:save` (Ứng viên đã đăng nhập)  
**Tham chiếu**: US-03, [BR-03]

**Response success** — `200 OK`  
Body: `ApiResponse<FollowResultDto>`
```json
{
  "success": true,
  "data": {
    "companyId": 1,
    "isFollowing": true, // true: Đã theo dõi, false: Đã bỏ theo dõi
    "followersCount": 142
  },
  "error": null
}
```

---

## 4. Danh mục Mã lỗi nghiệp vụ

| HTTP Status | Error Code | Message | Giải thích |
|-------------|------------|---------|------------|
| 404 | `COMPANY_NOT_FOUND` | Doanh nghiệp không tồn tại | ID công ty sai hoặc đã bị xóa |
| 403 | `COMPANY_FORBIDDEN_UPDATE`| Bạn không có quyền cập nhật thông tin doanh nghiệp này | Nhà tuyển dụng thuộc công ty khác cố tình gọi cập nhật [BR-01] |
