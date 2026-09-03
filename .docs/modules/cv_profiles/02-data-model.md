# 02 — Data Model: CV & Profile Management

> **Purpose**: Thiết kế cơ sở dữ liệu và các thực thể (Entities) cho phân hệ Quản lý Hồ sơ & CV.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `CV` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Sơ đồ ERD (high-level)

```
┌──────────────────┐
│   candidates     │ 1
│   (master)       │
└────────┬─────────┘
         │ 1
         │
         ▼ N
┌──────────────────┐
│  candidate_cvs   │
│  (E-01)          │
└──────────────────┘
```

---

## 3. Danh sách Entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | CandidateCv | `candidate_cvs` | Main | Thực thể lưu thông tin file CV tải lên hoặc tạo online |
| E-02 | CandidateEducation | `candidate_educations` | Detail | Học vấn chi tiết của ứng viên |
| E-03 | CandidateExperience | `candidate_experiences` | Detail | Kinh nghiệm làm việc chi tiết |
| E-04 | CandidateProject | `candidate_projects` | Detail | Dự án cá nhân / dự án tham gia |
| E-05 | CandidateCertificate | `candidate_certificates` | Detail | Chứng chỉ của ứng viên |
| E-06 | CandidateLanguage | `candidate_languages` | Detail | Khả năng ngoại ngữ |
| E-07 | Skill | `skills` | Master | Danh mục kỹ năng công nghệ chuẩn |
| E-08 | CandidateSkill | `candidate_skills` | Junction | Liên kết kỹ năng của ứng viên |

---

## 4. Chi tiết từng Entity

### 4.1 Master Entity: Candidate (`candidates`)
Bảng `candidates` được mở rộng thêm các cột sau để đồng bộ trạng thái tìm việc:

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `objective` | `TEXT` | YES | NULL | Mục tiêu nghề nghiệp | |
| `visibility_status` | `VARCHAR(30)` | NO | `'PRIVATE'`| Trạng thái tìm kiếm hồ sơ của ứng viên | PUBLIC, PRIVATE [BR-03] |

---

### 4.2 E-01: CandidateCv (`candidate_cvs`)
**Mô tả**: Lưu thông tin các tệp CV (định dạng PDF) do Ứng viên tải lên hệ thống hoặc xuất từ hồ sơ online.
**Tham chiếu**: [BR-01], [BR-02]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `candidate_id` | `INT UNSIGNED` | NO | — | Ứng viên sở hữu CV | FK -> `candidates.id` |
| `cv_title` | `VARCHAR(100)` | NO | — | Tiêu đề CV (tên hiển thị) | |
| `file_url` | `VARCHAR(255)` | YES | NULL | Đường dẫn lưu trữ file PDF trên server | [BR-01] |
| `is_default` | `TINYINT(1)` | NO | `0` | Đánh dấu CV mặc định dùng để ứng tuyển nhanh | [BR-02] |
| `file_size_bytes`| `INT UNSIGNED` | YES | NULL | Dung lượng file (phục vụ validation) | [BR-01] |
| `cv_type` | `VARCHAR(20)` | NO | `'UPLOAD'` | Loại CV (UPLOAD / ONLINE) | |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

---

### 4.3 E-02: CandidateEducation (`candidate_educations`)
**Mô tả**: Học vấn chi tiết của Ứng viên.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `candidate_id` | `INT UNSIGNED` | NO | — | FK ứng viên | FK -> `candidates.id` |
| `school_name` | `VARCHAR(150)` | NO | — | Tên trường | |
| `major` | `VARCHAR(100)` | NO | — | Chuyên ngành học | |
| `degree` | `VARCHAR(50)` | YES | NULL | Bằng cấp (Bachelor, Master...) | |
| `start_date` | `DATE` | NO | — | Ngày bắt đầu học | |
| `end_date` | `DATE` | YES | NULL | Ngày tốt nghiệp | |
| `description` | `TEXT` | YES | NULL | Mô tả kết quả, thành tích học tập | |

---

### 4.4 E-03: CandidateExperience (`candidate_experiences`)
**Mô tả**: Lịch sử kinh nghiệm làm việc thực tế.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `candidate_id` | `INT UNSIGNED` | NO | — | FK ứng viên | FK -> `candidates.id` |
| `company_name` | `VARCHAR(150)` | NO | — | Tên công ty cũ | |
| `position` | `VARCHAR(100)` | NO | — | Chức danh công việc | |
| `start_date` | `DATE` | NO | — | Ngày bắt đầu | |
| `end_date` | `DATE` | YES | NULL | Ngày kết thúc | Null nếu đang làm |
| `description` | `TEXT` | YES | NULL | Mô tả công việc và thành tựu | |

---

### 4.5 E-04: CandidateProject (`candidate_projects`)
**Mô tả**: Các dự án thực tế ứng viên tham gia.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `candidate_id` | `INT UNSIGNED` | NO | — | FK ứng viên | FK -> `candidates.id` |
| `project_name` | `VARCHAR(150)` | NO | — | Tên dự án | |
| `role` | `VARCHAR(100)` | NO | — | Vai trò trong dự án | |
| `technologies` | `TEXT` | YES | NULL | Công nghệ sử dụng | |
| `description` | `TEXT` | YES | NULL | Mô tả chi tiết dự án | |

---

### 4.6 E-05: CandidateCertificate (`candidate_certificates`)
**Mô tả**: Chứng chỉ nghiệp vụ CNTT.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `candidate_id` | `INT UNSIGNED` | NO | — | FK ứng viên | FK -> `candidates.id` |
| `certificate_name`| `VARCHAR(150)` | NO | — | Tên chứng chỉ | |
| `issued_by` | `VARCHAR(150)` | YES | NULL | Tổ chức cấp | |
| `issued_date` | `DATE` | YES | NULL | Ngày cấp | |
| `expiration_date`| `DATE` | YES | NULL | Ngày hết hạn | |

---

### 4.7 E-07: Skill (`skills`)
**Mô tả**: Danh mục kỹ năng công nghệ chuẩn hóa trong IT (ngôn ngữ lập trình, framework, DB, Cloud, DevOps).

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `skill_name` | `VARCHAR(100)` | NO | — | Tên kỹ năng (ví dụ: Java, Spring Boot) | Unique |
| `category` | `VARCHAR(50)` | NO | — | Phân loại (Languages, Frameworks, DB...) | |
| `related_skills` | `TEXT` | YES | NULL | Các kỹ năng liên quan (ví dụ: Spring Cloud, Hibernate...) | |

---

### 4.8 E-08: CandidateSkill (`candidate_skills`)
**Mô tả**: Bảng junction kết nối ứng viên và kỹ năng.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `candidate_id` | `INT UNSIGNED` | NO | — | FK ứng viên | FK -> `candidates.id` |
| `skill_id` | `INT UNSIGNED` | NO | — | FK kỹ năng | FK -> `skills.id` |
| `experience_months`| `INT` | YES | NULL | Số tháng kinh nghiệm thực tế của kỹ năng đó | |

*(Bảng này sử dụng Primary Key phức hợp gồm `(candidate_id, skill_id)`).*

