# 02 — Data Model: Companies Management

> **Purpose**: Thiết kế cơ sở dữ liệu và các thực thể (Entities) cho phân hệ Quản lý trang công ty & Thương hiệu doanh nghiệp.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `COM` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Sơ đồ ERD (high-level)

```
┌──────────────────┐
│   companies      │ 1
│   (E-01)         ├─────────┐
└────────▲─────────┘         │ 1
         │                   │
         │ N                 ▼ N
┌────────┴─────────┐ ┌───────────────┐
│candidate_follows │ │   employers   │
│(E-02)            │ │   (master)    │
└──────────────────┘ └───────────────┘
```

---

## 3. Danh sách Entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | Company | `companies` | Main | Thực thể lưu thông tin trang công ty / thương nghiệp |
| E-02 | CandidateFollow | `candidate_follows` | Junction | Bảng nối lưu vết Ứng viên theo dõi Công ty |

---

## 4. Chi tiết từng Entity

### 4.1 Bổ sung khóa ngoại vào bảng `employers` (Master)
Để liên kết nhiều Nhà tuyển dụng thuộc chung một Doanh nghiệp, bảng `employers` được bổ sung cột:
- `company_id`: `INT UNSIGNED NULL` -> Tạo FK `fk_employers_companies` liên kết đến `companies.id`.

Để liên kết tin tuyển dụng trực tiếp vào doanh nghiệp, bảng `jobs` được cập nhật FK `fk_jobs_companies` liên kết trực tiếp đến `companies.id` thay vì `employers.id` (hoặc giữ cả hai tùy nhu cầu, khuyến nghị liên kết tin tuyển dụng đến `companies` để hiển thị trên trang công ty độc lập người đăng).

---

### 4.2 E-01: Company (`companies`)
**Mô tả**: Lưu thông tin giới thiệu và thương hiệu tuyển dụng của doanh nghiệp.
**Tham chiếu**: [BR-01], [BR-02]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `INT UNSIGNED` | NO | AUTO_INCREMENT | PK | |
| `name` | `VARCHAR(150)` | NO | — | Tên doanh nghiệp | |
| `logo_url` | `VARCHAR(255)` | YES | NULL | Đường dẫn Logo công ty | [BR-02] |
| `banner_url` | `VARCHAR(255)` | YES | NULL | Đường dẫn ảnh bìa công ty | [BR-02] |
| `tax_code` | `VARCHAR(20)` | YES | NULL | Mã số thuế | |
| `website` | `VARCHAR(100)` | YES | NULL | Link website chính thức | |
| `industry` | `VARCHAR(100)` | NO | — | Ngành nghề hoạt động chính | |
| `size_range` | `VARCHAR(30)` | NO | — | Quy mô nhân sự (ví dụ: 10-50, 100-500) | |
| `founded_year` | `INT` | YES | NULL | Năm thành lập | |
| `address` | `TEXT` | NO | — | Danh sách địa chỉ văn phòng | |
| `description` | `TEXT` | YES | NULL | Giới thiệu chi tiết doanh nghiệp | |
| `benefits` | `TEXT` | YES | NULL | Chế độ đãi ngộ, phúc lợi công ty | |
| `contact` | `VARCHAR(150)` | YES | NULL | Thông tin liên hệ | |
| `social_links` | `JSON` | YES | NULL | Các liên kết mạng xã hội của công ty | |
| `verification_status` | `VARCHAR(30)` | NO | `'DRAFT'` | Trạng thái xác minh (DRAFT, PENDING_VERIFICATION, VERIFIED, REJECTED, SUSPENDED) | |
| *audit columns* | — | — | — | created_at, updated_at, deleted_at | |

---

### 4.3 E-02: CandidateFollow (`candidate_follows`)
**Mô tả**: Lưu danh sách Ứng viên theo dõi các doanh nghiệp.
**Tham chiếu**: [BR-03]

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `candidate_id` | `INT UNSIGNED` | NO | — | PK, Ứng viên theo dõi | FK -> `candidates.id` |
| `company_id` | `INT UNSIGNED` | NO | — | PK, Doanh nghiệp được theo dõi | FK -> `companies.id` |
| `followed_at` | `DATETIME(6)` | NO | — | Thời gian bấm theo dõi | |

*(Bảng này sử dụng Primary Key phức hợp gồm hai cột `(candidate_id, company_id)`).*
