# 01 — Feature Specification: Jobs Management

> **Purpose**: Mô tả yêu cầu nghiệp vụ của phân hệ Quản lý Tin tuyển dụng (Jobs Management).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `JOB` |
| Module name | Jobs Management |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Nhà tuyển dụng cần một kênh đăng tin tuyển dụng nhanh chóng, phân loại rõ ràng theo địa điểm, ngành nghề và mức lương để tiếp cận đúng đối tượng ứng viên. Ngược lại, ứng viên cần bộ lọc thông minh để tìm việc phù hợp nhất. Đồng thời, hệ thống cần cơ chế kiểm duyệt tin đăng từ Admin để loại bỏ các tin tuyển dụng lừa đảo, rác.

### 2.2 Mục tiêu module
- Hỗ trợ Nhà tuyển dụng tạo và đăng bài tuyển dụng đầy đủ thông tin (tiêu đề, mô tả, yêu cầu, mức lương, hạn nộp).
- Cung cấp bộ lọc tin tuyển dụng trực quan cho Ứng viên (lọc theo từ khóa, ngành nghề, thành phố, khoảng lương).
- Xây dựng quy trình kiểm duyệt tin đăng của Admin trước khi hiển thị công khai.

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Nhà tuyển dụng (EMPLOYER) | Đăng tin, quản lý trạng thái tin tuyển dụng của công ty | Chỉ tin tuyển dụng của công ty mình |
| Ứng viên (CANDIDATE) | Tìm kiếm, xem chi tiết tin tuyển dụng đã duyệt | Chỉ thấy các tin có trạng thái `PUBLISHED` |
| Quản trị viên (ADMIN) | Phê duyệt/từ chối hoặc khóa các tin tuyển dụng | Xem toàn bộ tin tuyển dụng |

---

## 3. User Stories

### US-01: Đăng tin tuyển dụng mới (Job Creation)
**Story**: Là **Company Owner / HR Manager**, tôi muốn **tạo và đăng tin tuyển dụng mới với đầy đủ thông tin chi tiết** để **thu hút các ứng viên IT phù hợp**.

**Acceptance Criteria**:
- **Given** Tôi đã đăng nhập và được phân quyền tạo công việc cho doanh nghiệp.
- **When** Tôi chọn "Tạo Job mới" và nhập các thông tin sau:
  1. **Job Information**: Job Title (Tiêu đề), Department (Phòng ban), Job Category (Danh mục công việc), Employment Type (Full-time, Part-time, Contract, Freelance, Internship, Temporary) [BR-03].
  2. **Location**: Country (Quốc gia), City (Tỉnh/Thành), District (Quận/Huyện), Office (Văn phòng cụ thể) và Work Mode (Remote, Hybrid, Onsite).
  3. **Salary**: Chọn Loại (Negotiable - Thỏa thuận, Range - Khoảng, Fixed - Cố định) và nhập giá trị tương ứng (ví dụ: 25,000,000 - 40,000,000 VND) [BR-01].
  4. **Experience & Level**: Fresher, Junior, Mid-level, Senior, Lead, Manager (Chuẩn IT Career Level: Intern, Fresher, Junior, Middle, Senior, Lead, Principal, Architect, Manager, Director).
  5. **Requirements**: Danh sách kỹ năng yêu cầu (e.g. PHP, Laravel, MySQL, Redis, Docker), số năm kinh nghiệm tối thiểu, trình độ học vấn tối thiểu.
  6. **Job Description**: Responsibilities (Nhiệm vụ), Requirements (Yêu cầu), Benefits (Quy mô/Phúc lợi), Working Environment, Working hours, Probation (Thời gian thử việc), Salary detail.
  và nhấn "Lưu nháp" hoặc "Gửi duyệt" [BR-02].
- **Then** Hệ thống tạo bản ghi tin tuyển dụng ở trạng thái tương ứng (`DRAFT` hoặc `PENDING_REVIEW`).

### US-02: Tìm kiếm và Lọc tin tuyển dụng
**Story**: Là **Ứng viên**, tôi muốn **tìm kiếm và lọc công việc IT theo nhiều tiêu chí** để **nhanh chóng tìm được công việc mong muốn**.

**Acceptance Criteria**:
- **Given** Tôi đang ở trang tìm kiếm việc làm.
- **When** Tôi tìm kiếm theo từ khóa và áp dụng bộ lọc: Địa điểm, Khoảng lương, Kinh nghiệm, Loại hình công việc (Employment Type), Work Mode (Remote/Hybrid/Onsite), Ngành nghề, Kỹ năng công nghệ, Công ty, Ngày đăng.
- **Then** Hệ thống hiển thị các tin tuyển dụng đang hoạt động (`PUBLISHED` và chưa hết hạn) khớp với bộ lọc đó.

### US-03: Kiểm duyệt tin tuyển dụng (Job Moderation)
**Story**: Là **Admin**, tôi muốn **kiểm duyệt nội dung tin tuyển dụng trước khi cho phép đăng tuyển** để **tránh các thông tin lừa đảo, sai lệch**.

**Acceptance Criteria**:
- **Given** Tôi truy cập danh sách tin tuyển dụng chờ kiểm duyệt.
- **When** Tôi duyệt qua nội dung (Kiểm tra xem Job có thật không, lương hợp lý không, nội dung sạch không, có spam không, có thông tin liên hệ đáng ngờ không) và nhấn:
  - **Approve**: Trạng thái chuyển sang `PUBLISHED` (Hiển thị công khai).
  - **Reject**: Nhập lý do từ chối. Trạng thái chuyển sang `REJECTED`.
  - **Request Edit**: Yêu cầu nhà tuyển dụng chỉnh sửa thêm thông tin.

### US-04: Đề xuất công việc (Job Recommendation)
**Story**: Là **Ứng viên**, tôi muốn **hệ thống tự động đề xuất các công việc phù hợp với hồ sơ** để **tối ưu thời gian tìm kiếm việc**.

**Acceptance Criteria**:
- **Given** Tôi đã hoàn thiện hồ sơ cá nhân (Skills, Experience, Location, Expected Salary).
- **When** Tôi truy cập trang chủ hoặc mục "Việc làm đề xuất".
- **Then** Hệ thống phân tích tỷ lệ trùng khớp (ví dụ: 94% Match, 89% Match) và hiển thị danh sách các job `PUBLISHED` phù hợp xếp theo thứ tự giảm dần của độ khớp.

### US-05: Quản lý Trạng thái Job (Job Statuses Lifecycle)
**Story**: Là **HR Manager**, tôi muốn **thay đổi trạng thái của tin tuyển dụng** để **điều tiết quy trình nhận hồ sơ tuyển dụng**.

**Acceptance Criteria**:
- **Given** Tôi quản lý danh sách tin tuyển dụng của công ty.
- **When** Tôi thực hiện các hành động thay đổi trạng thái:
  - **Pause**: Tạm dừng tin tuyển dụng (`PAUSED`). Ẩn khỏi tìm kiếm của ứng viên nhưng giữ hồ sơ ứng tuyển cũ.
  - **Close**: Đóng tuyển dụng (`CLOSED`). Ứng viên không thể ứng tuyển thêm.
  - **Re-publish**: Mở lại tin tuyển dụng đã tạm dừng hoặc hết hạn.

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | Mức lương tối thiểu (SalaryFrom) không được lớn hơn mức lương tối đa (SalaryTo) nếu chọn loại Range. | Tạo/Sửa tin tuyển dụng |
| BR-02 | Hạn ứng tuyển (ExpiredAt) phải nằm trong khoảng từ 7 ngày đến tối đa 90 ngày tính từ ngày đăng. | Tạo/Sửa tin tuyển dụng |
| BR-03 | Chỉ những doanh nghiệp có trạng thái `VERIFIED` mới được phép gửi tin tuyển dụng lên trạng thái `PENDING_REVIEW` hoặc chuyển sang `PUBLISHED`. | Gửi duyệt / Đăng tuyển |
| BR-04 | Tin tuyển dụng hết hạn ứng tuyển (`ExpiredAt < Now`) sẽ tự động chuyển sang trạng thái `EXPIRED` qua tác vụ Hangfire và ẩn khỏi kết quả tìm kiếm của Ứng viên. | Tác vụ nền & Tìm kiếm |
| BR-05 | Khi ứng viên ứng tuyển thành công vào Job, hệ thống lưu vết thông tin và chặn ứng tuyển trùng lặp. Không cho phép ứng tuyển vào các Job có trạng thái không phải `PUBLISHED`. | Nộp đơn ứng tuyển |
| BR-06 | Khi Job tuyển đủ số lượng chỉ tiêu tuyển dụng (`PositionsFilled >= Openings`), hệ thống tự động đóng tin tuyển dụng và chuyển trạng thái sang `CLOSED`. | Cập nhật kết quả Hired |
