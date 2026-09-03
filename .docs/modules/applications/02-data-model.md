# 02 — Data Model: Job Applications

> **Purpose**: Thiết kế cơ sở dữ liệu và các thực thể (Entities) cho phân hệ Ứng tuyển & Duyệt hồ sơ.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `APP` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Sơ đồ ERD (high-level)

```
      ┌──────────────┐
      │     jobs     │ 1
      │   (master)   │
      └──────┬───────┘
             │ 1
             │
             ▼ N
┌──────────────────────────┐
│   applications (E-01)    │
└────────────▲─────────────┘
             │ N
             │
             │ 1
      ┌──────┴───────┐
      │  candidates  │
      │   (master)   │
      └──────────────┘
```

---

## 3. Danh sách Entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | Application | `applications` | Main | Thực thể lưu thông tin hồ sơ nộp đơn ứng tuyển |

---

## 4. Chi tiết từng Entity

### 4.1 E-01: Application (`applications`)
**Mô tả**: Lưu thông tin ứng viên nộp hồ sơ ứng tuyển vào một tin tuyển dụng cụ thể.
**Tham chiếu**: [BR-01], [BR-02], [BR-03], [BR-04], [BR-05], [BR-06]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `job_id` | `INT UNSIGNED` | NO | — | Tin tuyển dụng ứng tuyển | FK -> `jobs.id` |
| `candidate_id` | `INT UNSIGNED` | NO | — | Ứng viên nộp đơn | FK -> `candidates.id` |
| `candidate_cv_id`| `INT UNSIGNED` | NO | — | Bản CV đính kèm lúc nộp | FK -> `candidate_cvs.id` |
| `cover_letter` | `TEXT` | YES | NULL | Thư xin việc | max 3000 ký tự |
| `status` | `VARCHAR(30)` | NO | `'APPLIED'` | Trạng thái tuyển dụng | APPLIED, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED, WITHDRAWN |
| `match_score` | `INT` | YES | NULL | Điểm số độ tương thích hồ sơ | 0 - 100 [US-05] |
| `applied_at` | `DATETIME(6)` | NO | — | Thời gian nộp hồ sơ | |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

**Các ràng buộc cơ sở dữ liệu (Database Constraints)**:
- **Unique Index**: Bắt buộc tạo unique index `uq_applications_candidate_job` trên hai cột `(candidate_id, job_id)` để đảm bảo ngăn ứng viên ứng tuyển 2 lần vào 1 vị trí [BR-01].

**Enum `status`**:
- `APPLIED`: Đã nộp đơn ứng tuyển thành công.
- `SCREENING`: Nhà tuyển dụng đang tiến hành sàng lọc sơ bộ.
- `SHORTLISTED`: Ứng viên tiềm năng được xếp vào danh sách shortlist.
- `INTERVIEW`: Đang trong các vòng phỏng vấn tuyển dụng.
- `OFFER`: Đã gửi lời mời nhận việc (Offer).
- `HIRED`: Ứng viên đã đồng ý nhận việc và được tuyển thành công.
- `REJECTED`: Nhà tuyển dụng từ chối hồ sơ ứng tuyển.
- `WITHDRAWN`: Ứng viên tự rút hồ sơ ứng tuyển.

