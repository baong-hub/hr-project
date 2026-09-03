# 02 — Data Model: Interview Scheduling

> **Purpose**: Thiết kế cơ sở dữ liệu và các thực thể (Entities) cho phân hệ Lịch hẹn phỏng vấn.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `INT` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Sơ đồ ERD (high-level)

```
┌──────────────────┐
│   applications   │ 1
│   (master)       │
└────────┬─────────┘
         │ 1
         │
         ▼ N
┌──────────────────┐
│  interviews      │
│  (E-01)          │
└──────────────────┘
```

---

## 3. Danh sách Entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | Interview | `interviews` | Main | Thực thể lưu thông tin vòng phỏng vấn |
| E-02 | InterviewEvaluation | `interview_evaluations` | Detail | Đánh giá chi tiết buổi phỏng vấn của người chấm |
| E-03 | TechnicalTest | `technical_tests` | Detail | Thông tin bài kiểm tra kỹ thuật |

---

## 4. Chi tiết từng Entity

### 4.1 E-01: Interview (`interviews`)
**Mô tả**: Lưu thông tin từng vòng phỏng vấn của ứng viên cho đơn ứng tuyển.
**Tham chiếu**: [BR-01], [BR-02], [BR-03], [BR-04]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `application_id` | `INT UNSIGNED` | NO | — | Đơn ứng tuyển liên quan | FK -> `applications.id` |
| `round_number` | `INT` | NO | `1` | Số thứ tự vòng phỏng vấn (1, 2, 3...) | |
| `round_name` | `VARCHAR(100)` | NO | — | Tên vòng (ví dụ: HR Screening, Technical...) | |
| `interviewer_id` | `INT UNSIGNED` | NO | — | Nhân sự thực hiện phỏng vấn | FK -> `employers.id` |
| `start_time` | `DATETIME(6)` | NO | — | Thời gian bắt đầu | [BR-01] |
| `end_time` | `DATETIME(6)` | NO | — | Thời gian kết thúc | `end_time > start_time` |
| `interview_type` | `VARCHAR(20)` | NO | `'ONLINE'` | Hình thức phỏng vấn | ONLINE, OFFLINE, PHONE |
| `location_or_link`| `VARCHAR(255)` | YES | NULL | Địa chỉ phỏng vấn hoặc link meeting | |
| `notes` | `TEXT` | YES | NULL | Ghi chú dặn dò ứng viên | |
| `status` | `VARCHAR(30)` | NO | `'INTERVIEW_INVITATION'` | Trạng thái vòng phỏng vấn | INTERVIEW_INVITATION, INTERVIEW_SCHEDULED, DECLINED, INTERVIEW_COMPLETED, EVALUATION, CANCELLED |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

**Enum `status`**:
- `INTERVIEW_INVITATION`: Đã gửi lời mời phỏng vấn cho ứng viên.
- `INTERVIEW_SCHEDULED`: Ứng viên chấp nhận tham gia, lịch đã được khóa.
- `DECLINED`: Ứng viên từ chối lời mời.
- `INTERVIEW_COMPLETED`: Phỏng vấn đã hoàn tất.
- `EVALUATION`: Đã hoàn thành đánh giá kết quả vòng này.
- `CANCELLED`: Vòng phỏng vấn bị hủy bỏ.

---

### 4.2 E-02: InterviewEvaluation (`interview_evaluations`)
**Mô tả**: Ghi nhận kết quả đánh giá các chỉ số từ người phỏng vấn.

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `interview_id` | `INT UNSIGNED` | NO | — | Vòng phỏng vấn được đánh giá | FK -> `interviews.id` |
| `technical_score` | `DECIMAL(3,1)` | NO | — | Điểm chuyên môn (thang điểm 10) | |
| `communication_score`| `DECIMAL(3,1)`| NO | — | Điểm giao tiếp (thang điểm 10) | |
| `problem_solving_score`| `DECIMAL(3,1)`| NO | — | Điểm giải quyết vấn đề | |
| `experience_score` | `DECIMAL(3,1)` | NO | — | Điểm kinh nghiệm làm việc | |
| `culture_fit_score` | `DECIMAL(3,1)` | NO | — | Điểm phù hợp văn hóa | |
| `salary_expectation_score`| `DECIMAL(3,1)`| NO | — | Điểm phù hợp kỳ vọng lương | |
| `overall_score` | `DECIMAL(3,1)` | NO | — | Điểm trung bình tổng hợp | |
| `result` | `VARCHAR(20)` | NO | — | Kết quả (PASS, FAIL, NEXT_ROUND) | |
| `comments` | `TEXT` | YES | NULL | Nhận xét chi tiết tổng hợp | |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

---

### 4.3 E-03: TechnicalTest (`technical_tests`)
**Mô tả**: Lưu thông tin kết quả bài kiểm tra kỹ thuật (Coding Test/System Design).

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `application_id` | `INT UNSIGNED` | NO | — | Đơn ứng tuyển tương ứng | FK -> `applications.id` |
| `test_type` | `VARCHAR(50)` | NO | — | Loại (CODING, SYSTEM_DESIGN, TAKE_HOME) | |
| `duration_minutes`| `INT` | NO | — | Thời lượng làm bài (phút) | |
| `score` | `INT` | NO | `0` | Điểm số đạt được (thang 100) | |
| `status` | `VARCHAR(20)` | NO | `'FAILED'` | Trạng thái kết quả (PASSED, FAILED) | |
| `notes` | `TEXT` | YES | NULL | Ghi chú, lời khuyên của người chấm | |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

