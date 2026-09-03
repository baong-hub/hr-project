# 02 — Data Model: Notifications Management

> **Purpose**: Thiết kế cơ sở dữ liệu và các thực thể (Entities) cho phân hệ Trung tâm & Nhật ký thông báo.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `NOT` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Sơ đồ ERD (high-level)

```
┌──────────────────┐
│     users        │ 1
│    (master)      │
└────────┬─────────┘
         │ 1
         │
         ▼ N
┌──────────────────┐
│  notifications   │
│  (E-01)          │
└──────────────────┘
```

---

## 3. Danh sách Entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | Notification | `notifications` | Main | Lưu lịch sử thông báo hệ thống gửi cho người dùng |

---

## 4. Chi tiết từng Entity

### 4.1 E-01: Notification (`notifications`)
**Mô tả**: Lưu thông tin thông báo đẩy của hệ thống.
**Tham chiếu**: [BR-01], [BR-02], [BR-03]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | PK |
| `user_id` | `INT UNSIGNED` | NO | — | Tài khoản nhận thông báo | FK -> `users.id`, [BR-01] |
| `title` | `VARCHAR(150)` | NO | — | Tiêu đề thông báo | |
| `content` | `TEXT` | NO | — | Nội dung chi tiết thông báo | |
| `notification_type`| `VARCHAR(30)` | NO | — | Phân loại thông báo | APPLICATION_STATUS, INTERVIEW_INVITE, JOB_ALERT [BR-02] |
| `is_read` | `TINYINT(1)` | NO | `0` | Trạng thái đã đọc (1/0) | |
| `redirect_url` | `VARCHAR(255)` | YES | NULL | Đường dẫn điều hướng khi click | ví dụ: `/employer/applications/1` |
| `created_at` | `DATETIME(6)` | NO | — | Thời gian tạo thông báo | [BR-03] |
| `updated_at` | `DATETIME(6)` | NO | — | Thời gian cập nhật trạng thái | |

**Thiết lập Chỉ mục (Index Configuration)**:
- Bắt buộc cấu hình chỉ mục `idx_notifications_user_unread` trên 2 cột `(user_id, is_read)` để tối ưu hóa tốc độ truy vấn đếm số lượng tin chưa đọc hiển thị ở Header Web.
