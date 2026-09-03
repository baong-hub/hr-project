# 02 — Data Model: Saved Jobs & Interactions

> **Purpose**: Thiết kế cơ sở dữ liệu và các thực thể (Entities) cho phân hệ Việc làm đã lưu & Tương tác.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `SAV` |
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
│    saved_jobs    │
│    (E-01)        │
└────────▲─────────┘
         │ N
         │
         │ 1
┌────────┴─────────┐
│     jobs         │
│   (master)       │
└──────────────────┘
```

---

## 3. Danh sách Entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | SavedJob | `saved_jobs` | Junction | Thực thể lưu mối liên kết Ứng viên đánh dấu Tin tuyển dụng |

---

## 4. Chi tiết từng Entity

### 4.1 E-01: SavedJob (`saved_jobs`)
**Mô tả**: Lưu thông tin đánh dấu (bookmark) tin tuyển dụng của ứng viên.
**Tham chiếu**: [BR-01], [BR-02]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `candidate_id` | `INT UNSIGNED` | NO | — | Ứng viên thực hiện lưu | PK, FK -> `candidates.id` |
| `job_id` | `INT UNSIGNED` | NO | — | Tin tuyển dụng được lưu | PK, FK -> `jobs.id` |
| `saved_at` | `DATETIME(6)` | NO | — | Thời gian thực hiện lưu | |

*(Thực thể này sử dụng khóa chính phức hợp gồm 2 trường `(candidate_id, job_id)` để đảm bảo tính duy nhất, không trùng lặp quan hệ).*
