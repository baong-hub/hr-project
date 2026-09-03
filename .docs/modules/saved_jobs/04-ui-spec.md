# 04 — UI Specification: Saved Jobs & Interactions

> **Purpose**: Định nghĩa giao diện trang việc làm đã lưu và kịch bản tương tác cho phân hệ Việc làm đã lưu & Tương tác.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `SAV` |
| Feature folder | `src/app/features/saved_jobs/` |
| Route prefix | `/candidate/saved-jobs` |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Page (Routes)

| ID | Route | Page Component | Mục đích | Quyền truy cập |
|----|-------|----------------|----------|----------------|
| PG-01 | `/candidate/saved-jobs` | `SavedJobListPage` | Hiển thị danh sách các việc làm ứng viên đã lưu | `job:save` |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 PG-01: `SavedJobListPage` (Việc làm đã lưu)
- **Bố cục (Layout)**:
  - Tiêu đề: "Việc làm đã lưu của bạn".
  - Hiển thị danh sách việc làm dạng danh sách dọc (Job Cards Column):
    - Mỗi thẻ chứa: Logo công ty, Tiêu đề việc làm, Tên công ty, Mức lương, Hạn nộp hồ sơ, Ngày đã lưu.
    - Phía góc phải trên của mỗi thẻ: Biểu tượng Bookmark (hoặc Trái tim) màu xanh thương hiệu (`--color-brand-primary`) thể hiện trạng thái đã lưu.
    - Chân thẻ: Nút `Ứng tuyển ngay` (Nền xanh lá) [BR-02].

**Tương tác (Interactions)**:
- Click vào nút Bookmark màu xanh:
  - Gọi API EP-01 để hủy lưu tin tuyển dụng này.
  - Ẩn ngay thẻ việc làm này khỏi danh sách (hoặc hiển thị thông báo "Đã hủy lưu" kèm nút "Hoàn tác" để khôi phục).
- **Trường hợp tin tuyển dụng đã đóng hoặc hết hạn**:
  - Giao diện làm mờ nhẹ thẻ việc làm (opacity 0.6).
  - Hiển thị badge trạng thái "Hết hạn" hoặc "Đóng tin" màu đỏ `--color-danger` ở góc thẻ.
  - Vô hiệu hóa (Disabled) nút `Ứng tuyển ngay` [BR-02].
