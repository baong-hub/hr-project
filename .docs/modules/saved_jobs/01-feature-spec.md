# 01 — Feature Specification: Saved Jobs & Interactions

> **Purpose**: Mô tả yêu cầu nghiệp vụ của phân hệ Việc làm đã lưu & Tương tác (Saved Jobs & Interactions).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `SAV` |
| Module name | Saved Jobs & Interactions |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Ứng viên khi lướt xem tin tuyển dụng thường thấy nhiều cơ hội hấp dẫn nhưng chưa thể ứng tuyển ngay (chưa có CV phù hợp, cần thời gian viết cover letter, hoặc muốn tham khảo thêm). Việc ghi nhớ thủ công rất khó khăn. Tính năng lưu tin tuyển dụng giúp ứng viên đánh dấu nhanh và quản lý tập trung các công việc ưu tiên để ứng tuyển khi sẵn sàng.

### 2.2 Mục tiêu module
- Cho phép Ứng viên lưu/hủy lưu tin tuyển dụng tức thời từ trang danh sách hoặc trang chi tiết công việc.
- Cung cấp trang Quản lý việc làm đã lưu hiển thị danh sách các tin tuyển dụng ứng viên đã đánh dấu.

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Ứng viên (CANDIDATE) | Lưu tin tuyển dụng, xem danh sách việc đã lưu | Chỉ xem được dữ liệu việc đã lưu của chính mình |

---

## 3. User Stories

### US-01: Lưu / Hủy lưu tin tuyển dụng (Toggle Save Job)
**Story**: Là **Ứng viên**, tôi muốn **bấm lưu tin tuyển dụng** để **lưu lại tin đăng tuyển và xem lại sau**.

**Acceptance Criteria**:
- **Given** Tôi đã đăng nhập và đang xem danh sách hoặc trang chi tiết tin tuyển dụng [BR-01].
- **When** Tôi click vào biểu tượng Lưu (Bookmark/Heart).
- **Then** Hệ thống lưu tin đăng đó vào danh sách việc làm đã lưu và chuyển đổi biểu tượng thành trạng thái "Đã lưu". Click lại lần 2 sẽ hủy lưu.

### US-02: Xem danh sách Việc làm đã lưu
**Story**: Là **Ứng viên**, tôi muốn **truy cập danh sách việc làm đã lưu** để **tiến hành nộp đơn ứng tuyển cho các công việc này**.

**Acceptance Criteria**:
- **Given** Tôi mở mục "Việc làm đã lưu".
- **When** Hệ thống trả về danh sách các việc làm tôi đã bookmark.
- **Then** Với mỗi việc làm, hiển thị đầy đủ tiêu đề, tên công ty, mức lương, hạn nộp hồ sơ.
- **When** Có tin tuyển dụng đã hết hạn (`EXPIRED`) hoặc đóng (`CLOSED`).
- **Then** Tin tuyển dụng đó vẫn hiển thị trong danh sách nhưng được gắn badge cảnh báo và nút "Ứng tuyển ngay" bị vô hiệu hóa [BR-02].

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | Chỉ ứng viên đã đăng nhập hệ thống mới được phép lưu tin tuyển dụng. | Lưu tin tuyển dụng |
| BR-02 | Tin tuyển dụng đã lưu bị hết hạn, bị đóng hoặc bị ẩn bởi Admin vẫn hiển thị trong danh sách đã lưu của ứng viên nhưng hiển thị trạng thái ngưng tuyển dụng và chặn hành động ứng tuyển. | Xem danh sách đã lưu |
