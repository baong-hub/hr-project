# 03 — API Contract: Saved Jobs & Interactions

> **Purpose**: Định nghĩa chi tiết giao tiếp API của phân hệ Việc làm đã lưu & Tương tác.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `SAV` |
| API base path | `/api/v1/jobs` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | POST | `/api/v1/jobs/{id}/save` | Lưu / Hủy lưu tin tuyển dụng | `job:save` | US-01 |
| EP-02 | GET | `/api/v1/jobs/saved` | Lấy danh sách tin tuyển dụng đã lưu | `job:save` | US-02 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Lưu / Hủy lưu tin tuyển dụng

**Method & Path**: `POST /api/v1/jobs/{id}/save`  
**Permission**: `job:save` (Ứng viên đăng nhập)  
**Tham chiếu**: US-01, [BR-01], [E-01]

**Response success** — `200 OK`  
Body: `ApiResponse<SaveToggleResultDto>`
```json
{
  "success": true,
  "data": {
    "jobId": 12,
    "isSaved": true // true: Đã lưu, false: Đã hủy lưu
  },
  "error": null
}
```

---

### 3.2 EP-02: Lấy danh sách việc làm đã lưu

**Method & Path**: `GET /api/v1/jobs/saved`  
**Permission**: `job:save` (Ứng viên)  
**Tham chiếu**: US-02, [BR-02]

**Query Parameters**:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `page` | `int` | No | Trang số, mặc định = 1 |
| `pageSize` | `int` | No | Số tin đăng trên trang, mặc định = 10 |

**Response success** — `200 OK`  
Body: `ApiResponse<SavedJobDto[]>` kèm theo thông tin phân trang `meta`.
- **Lưu ý**: Các tin tuyển dụng ở trạng thái `CLOSED` hoặc `EXPIRED` vẫn được trả về trong danh sách nhưng có cờ cảnh báo [BR-02].

---

## 4. DTO Models (Response Shapes)

### 4.1 `SavedJobDto`
```typescript
export interface SavedJobDto {
  jobId: number;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  salaryFrom?: number;
  salaryTo?: number;
  city: string;
  expiredAt: string;
  jobStatus: string; // Trạng thái tin gốc: PUBLISHED, EXPIRED, CLOSED
  savedAt: string;
}
```

---

## 5. Danh mục Mã lỗi nghiệp vụ

| HTTP Status | Error Code | Message | Giải thích |
|-------------|------------|---------|------------|
| 404 | `JOB_NOT_FOUND` | Tin tuyển dụng không tồn tại | ID tin tuyển dụng truyền lên sai |
