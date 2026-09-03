# 02 — Data Model: Jobs Management

> **Purpose**: Thiết kế cơ sở dữ liệu và các thực thể (Entities) cho phân hệ Quản lý Tin tuyển dụng.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `JOB` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Sơ đồ ERD (high-level)

```
┌──────────────────┐
│  employers       │ 1
│  (master)        │
└────────┬─────────┘
         │ 1
         │
         ▼ N
┌──────────────────┐
│    jobs (E-01)   │
└──────────────────┘
```

---

## 3. Danh sách Entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | Job | `jobs` | Main | Entity chính lưu thông tin tin tuyển dụng |

---

## 4. Chi tiết từng Entity

### 4.1 E-01: Job (`jobs`)
**Mô tả**: Lưu thông tin tin tuyển dụng của các doanh nghiệp.
**Tham chiếu**: [BR-01], [BR-02], [BR-03], [BR-04], [BR-05], [BR-06]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `company_id` | `INT UNSIGNED` | NO | — | Doanh nghiệp sở hữu tin | FK -> `companies.id` |
| `employer_id` | `INT UNSIGNED` | NO | — | HR tạo tin đăng | FK -> `employers.id` |
| `title` | `VARCHAR(150)` | NO | — | Tiêu đề công việc (ví dụ: Senior Backend Developer) | |
| `department` | `VARCHAR(100)` | YES | NULL | Phòng ban | IT, Software Development, etc. |
| `category` | `VARCHAR(100)` | NO | — | Danh mục ngành nghề | |
| `employment_type` | `VARCHAR(30)` | NO | — | Loại hình (Full-time, Part-time, Contract, etc.) | |
| `country` | `VARCHAR(50)` | NO | `'VIETNAM'` | Quốc gia | |
| `city` | `VARCHAR(50)` | NO | — | Tỉnh / Thành phố | |
| `district` | `VARCHAR(50)` | YES | NULL | Quận / Huyện | |
| `office` | `VARCHAR(200)` | YES | NULL | Chi nhánh văn phòng làm việc | |
| `work_mode` | `VARCHAR(20)` | NO | `'ONSITE'` | Hình thức (ONSITE, HYBRID, REMOTE) | |
| `salary_type` | `VARCHAR(20)` | NO | `'NEGOTIABLE'` | Loại lương (NEGOTIABLE, RANGE, FIXED) | |
| `salary_from` | `DECIMAL(18,2)` | YES | NULL | Lương tối thiểu | [BR-01], nullable |
| `salary_to` | `DECIMAL(18,2)` | YES | NULL | Lương tối đa | [BR-01], nullable |
| `experience_level` | `VARCHAR(30)` | NO | — | Cấp bậc kinh nghiệm (Intern, Fresher, Junior, Middle, Senior...) | |
| `experience_years_min` | `INT` | YES | NULL | Số năm kinh nghiệm tối thiểu yêu cầu | |
| `education` | `VARCHAR(100)` | YES | NULL | Trình độ học vấn yêu cầu | |
| `description` | `TEXT` | NO | — | Mô tả công việc (Responsibilities, Requirements...) | |
| `probation_duration` | `VARCHAR(50)` | YES | NULL | Thời gian thử việc | |
| `openings` | `INT` | NO | `1` | Số lượng cần tuyển | |
| `hired_count` | `INT` | NO | `0` | Số lượng đã tuyển được | |
| `status` | `VARCHAR(30)` | NO | `'DRAFT'` | Trạng thái tin tuyển dụng | DRAFT, PENDING_REVIEW, PUBLISHED, PAUSED, EXPIRED, CLOSED, REJECTED |
| `expired_at` | `DATE` | NO | — | Hạn ứng tuyển | [BR-02] |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

**Enum `status`**:
- `DRAFT`: Bản nháp, HR chưa gửi duyệt.
- `PENDING_REVIEW`: Đang chờ Admin kiểm duyệt nội dung.
- `PUBLISHED`: Đã được duyệt, đang công khai hiển thị tìm ứng viên.
- `PAUSED`: Tạm dừng hiển thị, ứng viên không thể nộp đơn.
- `REJECTED`: Bị Admin từ chối duyệt.
- `EXPIRED`: Đã quá hạn ứng tuyển (Tác vụ Hangfire quét tự động).
- `CLOSED`: HR chủ động đóng hoặc hệ thống tự động đóng khi tuyển đủ người (`hired_count >= openings`).

