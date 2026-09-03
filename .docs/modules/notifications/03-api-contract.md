# 03 — API Contract: Notifications Management

> **Purpose**: Định nghĩa chi tiết giao tiếp API của phân hệ Trung tâm & Nhật ký thông báo.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `NOT` |
| API base path | `/api/v1/notifications` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | GET | `/api/v1/notifications` | Lấy danh sách thông báo (Phân trang) | `[Authorize]` | US-02 |
| EP-02 | GET | `/api/v1/notifications/unread-count` | Lấy số lượng thông báo chưa đọc | `[Authorize]` | US-02 |
| EP-03 | PATCH | `/api/v1/notifications/{id}/read` | Đánh dấu thông báo đã đọc | `[Authorize]` | US-02 |
| EP-04 | POST | `/api/v1/notifications/read-all` | Đánh dấu tất cả thông báo là đã đọc | `[Authorize]` | US-02 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Lấy danh sách thông báo

**Method & Path**: `GET /api/v1/notifications`  
**Permission**: `[Authorize]` (Mọi người dùng đã đăng nhập)  
**Tham chiếu**: US-02, [BR-01], [E-01]

**Query Parameters**:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `page` | `int` | No | Trang số, mặc định = 1 |
| `pageSize` | `int` | No | Số thông báo hiển thị, mặc định = 10 |

**Response success** — `200 OK`  
Body: `ApiResponse<NotificationDto[]>` kèm phân trang.
- **Quy tắc**: Chỉ hiển thị thông báo của user đăng nhập hiện tại [BR-01].

---

### 3.2 EP-02: Lấy số lượng thông báo chưa đọc

**Method & Path**: `GET /api/v1/notifications/unread-count`  
**Permission**: `[Authorize]`  
**Tham chiếu**: US-01, US-02

**Response success** — `200 OK`  
Body: `ApiResponse<UnreadCountDto>`
```json
{
  "success": true,
  "data": {
    "count": 5
  },
  "error": null
}
```

---

### 3.3 EP-03: Đánh dấu thông báo đã đọc

**Method & Path**: `PATCH /api/v1/notifications/{id}/read`  
**Permission**: `[Authorize]`  
**Tham chiếu**: US-02

**Response success** — `200 OK`  
Body: `ApiResponse<bool>`

---

## 4. DTO Models (Response Shapes)

### 4.1 `NotificationDto`
```typescript
export interface NotificationDto {
  id: number;
  title: string;
  content: string;
  notificationType: string; // APPLICATION_STATUS, INTERVIEW_INVITE, JOB_ALERT
  isRead: boolean;
  redirectUrl?: string;
  createdAt: string;
}
```

---

## 5. Danh mục Mã lỗi nghiệp vụ

| HTTP Status | Error Code | Message | Giải thích |
|-------------|------------|---------|------------|
| 404 | `NOTIFICATION_NOT_FOUND` | Thông báo không tồn tại | ID thông báo sai |
| 403 | `NOTIFICATION_FORBIDDEN` | Bạn không có quyền thao tác trên thông báo này | Cố tình sửa trạng thái thông báo của tài khoản khác [BR-01] |
