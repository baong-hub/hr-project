# 02 — Data Model: Reports & Analytics

> **Purpose**: Thiết kế cơ sở dữ liệu lưu vết tương tác và mô hình hóa dữ liệu tổng hợp cho phân hệ Báo cáo & Thống kê.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `REP` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Entity

Phân hệ báo cáo thực hiện các câu lệnh truy vấn tổng hợp từ các bảng nghiệp vụ, kết hợp với các thực thể ghi nhận tương tác và cấu hình kinh doanh sau:

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | JobViewLog | `job_view_logs` | Log | Lưu vết mỗi lượt ứng viên xem chi tiết tin tuyển dụng |
| E-02 | ViolationReport | `violation_reports` | Main | Lưu hồ sơ báo cáo vi phạm Job/Company của ứng viên |
| E-03 | RecruitmentCampaign | `recruitment_campaigns` | Main | Chiến dịch tuyển dụng của doanh nghiệp |
| E-04 | CompanySubscription | `company_subscriptions` | Main | Gói dịch vụ đã đăng ký của doanh nghiệp |

---

## 3. Chi tiết Entity

### 3.1 E-01: JobViewLog (`job_view_logs`)
**Mô tả**: Lưu vết click xem tin tuyển dụng của người dùng để tính lượt xem (Views).

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `job_id` | `INT UNSIGNED` | NO | — | Tin tuyển dụng được xem | FK -> `jobs.id` |
| `user_id` | `INT UNSIGNED` | YES | NULL | ID tài khoản người xem (nếu đã đăng nhập)| FK -> `users.id` |
| `ip_address` | `VARCHAR(45)` | NO | — | Địa chỉ IP của client | |
| `user_agent` | `VARCHAR(255)` | YES | NULL | Thông tin trình duyệt/thiết bị | |
| `viewed_at` | `DATETIME(6)` | NO | — | Thời gian tương tác | |

*(Bảng này không sử dụng Soft Delete).*

---

### 3.2 E-02: ViolationReport (`violation_reports`)
**Mô tả**: Ghi nhận báo cáo vi phạm từ ứng viên gửi đến Admin kiểm duyệt.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `reporter_id` | `INT UNSIGNED` | NO | — | Ứng viên gửi báo cáo | FK -> `candidates.id` |
| `target_type` | `VARCHAR(30)` | NO | — | Loại đối tượng bị báo cáo (JOB, COMPANY) | |
| `target_id` | `INT UNSIGNED` | NO | — | ID của đối tượng bị báo cáo | |
| `reason` | `VARCHAR(50)` | NO | — | Lý do vi phạm (SCAM, FAKE, SALARY...) | |
| `description` | `TEXT` | YES | NULL | Chi tiết nội dung phản ánh | |
| `status` | `VARCHAR(30)` | NO | `'PENDING'` | Trạng thái xử lý (PENDING, RESOLVED) | |
| `resolution` | `VARCHAR(50)` | YES | NULL | Biện pháp xử lý của Admin (WARNING, HIDE...) | |
| `resolved_by` | `INT UNSIGNED` | YES | NULL | Admin thực hiện xử lý | FK -> `users.id` |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

---

### 3.3 E-03: RecruitmentCampaign (`recruitment_campaigns`)
**Mô tả**: Lưu thông tin chiến dịch tuyển dụng của Employer.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `company_id` | `INT UNSIGNED` | NO | — | Doanh nghiệp sở hữu chiến dịch | FK -> `companies.id` |
| `title` | `VARCHAR(150)` | NO | — | Tiêu đề chiến dịch | |
| `budget` | `DECIMAL(18,2)` | NO | `0.00` | Ngân sách chiến dịch | |
| `status` | `VARCHAR(30)` | NO | `'ACTIVE'` | Trạng thái (ACTIVE, COMPLETED, PAUSED) | |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

---

### 3.4 E-04: CompanySubscription (`company_subscriptions`)
**Mô tả**: Gói dịch vụ đã mua và các giới hạn tài nguyên của Doanh nghiệp.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `company_id` | `INT UNSIGNED` | NO | — | Doanh nghiệp đăng ký | FK -> `companies.id` |
| `plan_name` | `VARCHAR(50)` | NO | `'FREE'` | Tên gói (FREE, PRO, BUSINESS, ENTERPRISE) | |
| `max_jobs` | `INT` | NO | `3` | Số lượng job tối đa được đăng cùng lúc | |
| `max_cv_views` | `INT` | NO | `10` | Lượt xem hồ sơ ứng viên tối đa mỗi tháng | |
| `max_recruiters` | `INT` | NO | `1` | Số lượng tài khoản HR tối đa trong công ty | |
| `ai_screening` | `TINYINT(1)` | NO | `0` | Hỗ trợ tính năng lọc CV bằng AI (0/1) | |
| `start_date` | `DATE` | NO | — | Ngày bắt đầu gói | |
| `end_date` | `DATE` | NO | — | Ngày hết hạn | |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |
