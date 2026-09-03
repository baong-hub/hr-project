# 01 — Feature Specification: CV & Profile Management

> **Purpose**: Mô tả yêu cầu nghiệp vụ của phân hệ Quản lý Hồ sơ & CV (CV & Profile Management).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `CV` |
| Module name | CV & Profile Management |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Ứng viên cần một khu vực trung tâm để lưu trữ hồ sơ cá nhân (thông tin kinh nghiệm làm việc, trình độ học vấn, kỹ năng chuyên môn) và tải lên các bản CV định dạng PDF để tiện ứng tuyển. Nhà tuyển dụng cũng cần công cụ tìm kiếm hồ sơ ứng viên chất lượng dựa trên kỹ năng và từ khóa để chủ động liên hệ tuyển dụng, thay vì chỉ thụ động đợi nhận hồ sơ ứng tuyển.

### 2.2 Mục tiêu module
- Cho phép Ứng viên cập nhật hồ sơ cá nhân và quản lý nhiều CV trực tuyến.
- Hỗ trợ tải lên file CV PDF và lưu trữ an toàn trên máy chủ.
- Cung cấp tính năng tìm kiếm hồ sơ ứng viên cho Nhà tuyển dụng theo kỹ năng, vị trí công việc, địa điểm làm việc.

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Ứng viên (CANDIDATE) | Tạo hồ sơ, tải lên CV, chuyển đổi trạng thái tìm kiếm việc | Quản lý toàn bộ thông tin của mình |
| Nhà tuyển dụng (EMPLOYER) | Tìm kiếm hồ sơ, tải CV của ứng viên công khai | Chỉ thấy hồ sơ của ứng viên đặt chế độ tìm việc công khai (`PUBLIC`) |

---

## 3. User Stories

### US-01: Cập nhật hồ sơ năng lực cá nhân (Candidate Profile)
**Story**: Là **Ứng viên**, tôi muốn **cập nhật chi tiết các phần thông tin hồ sơ của mình** để **Nhà tuyển dụng có thể tìm kiếm và đánh giá năng lực**.

**Acceptance Criteria**:
- **Given** Tôi truy cập trang "Hồ sơ cá nhân".
- **When** Tôi chỉnh sửa các khối thông tin sau:
  - **Personal Information**: Ảnh đại diện, họ tên, số điện thoại, email, địa chỉ, ngày sinh, giới tính.
  - **Career Objective**: Mục tiêu nghề nghiệp ngắn hạn và dài hạn.
  - **Skills**: Danh sách kỹ năng công nghệ (ví dụ: Java, React, SQL...).
  - **Experience**: Lịch sử kinh nghiệm làm việc (Công ty, vị trí, thời gian bắt đầu/kết thúc, mô tả công việc).
  - **Education**: Trình độ học vấn (Trường học, ngành học, bằng cấp, niên khóa).
  - **Projects**: Dự án cá nhân hoặc dự án tại công ty cũ (Tên dự án, vai trò, công nghệ sử dụng, mô tả chi tiết).
  - **Certificates**: Các chứng chỉ đã đạt được (ví dụ: AWS Cloud Practitioner, PMP...).
  - **Languages**: Khả năng ngoại ngữ (Ngôn ngữ, trình độ/chứng chỉ kèm theo).
  và nhấn nút "Lưu".
- **Then** Hệ thống cập nhật dữ liệu hồ sơ và phản hồi lưu thành công.

### US-02: Quản lý CV cá nhân (CV Management)
**Story**: Là **Ứng viên**, tôi muốn **tải lên tệp CV sẵn có hoặc tự thiết kế CV trực tuyến và đặt một bản CV làm mặc định** để **tiện ứng tuyển nhanh vào các Job**.

**Acceptance Criteria**:
- **Given** Tôi đang ở trang Quản lý CV.
- **When** Tôi thực hiện một trong hai hành động:
  - **Upload CV**: Tải lên tệp tin từ máy tính dạng PDF [BR-01].
  - **Create CV**: Thiết kế CV trực tuyến từ thông tin Hồ sơ cá nhân.
- **Then** CV được lưu vào danh sách.
- **When** Tôi có nhiều CV (ví dụ: Backend Developer CV, DevOps CV) và bấm chọn "Đặt làm mặc định" cho một bản CV nhất định [BR-02].
- **Then** CV đó được đánh dấu là CV mặc định (Default CV) để tự động điền khi ứng tuyển nhanh.

### US-03: Bật/tắt chế độ tìm kiếm hồ sơ (Profile Visibility)
**Story**: Là **Ứng viên**, tôi muốn **bật hoặc tắt chế độ cho phép Nhà tuyển dụng tìm kiếm hồ sơ** để **bảo vệ thông tin cá nhân hoặc chủ động đón nhận cơ hội việc làm mới**.

**Acceptance Criteria**:
- **Given** Tôi đang ở trang Hồ sơ cá nhân.
- **When** Tôi chuyển đổi trạng thái "Cho phép tìm kiếm hồ sơ" giữa `PUBLIC` (Công khai) và `PRIVATE` (Ẩn).
- **Then** Hệ thống cập nhật trạng thái tìm kiếm [BR-03].

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | File CV tải lên bắt buộc phải ở định dạng `.pdf`, dung lượng tối đa không vượt quá `5MB`. | Tải lên CV |
| BR-02 | Mỗi ứng viên chỉ được phép lưu tối đa 5 bản CV trên hệ thống. Chỉ được chọn duy nhất 1 bản CV làm "CV mặc định" (Default CV) để nộp đơn nhanh. | Tải lên / Tạo mới CV |
| BR-03 | Nhà tuyển dụng chỉ được xem đầy đủ thông tin liên hệ (SĐT, Email) và tải CV của Ứng viên từ kết quả tìm kiếm nếu Ứng viên bật chế độ công khai hồ sơ (`PUBLIC`). | Tìm kiếm ứng viên |
| BR-04 | Ứng viên có quyền cập nhật, chỉnh sửa thông tin hồ sơ của mình bất kỳ lúc nào nhưng những thông tin này sẽ không tự động cập nhật đè lên các đơn ứng tuyển cũ đã được nộp từ trước. | Chỉnh sửa hồ sơ |
