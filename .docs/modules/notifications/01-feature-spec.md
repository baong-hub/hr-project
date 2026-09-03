# 01 — Feature Specification: Notifications Management

> **Purpose**: Mô tả yêu cầu nghiệp vụ của phân hệ Trung tâm & Nhật ký thông báo (Notifications Management).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `NOT` |
| Module name | Notifications Management |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Trong quy trình tuyển dụng nhanh, việc phản hồi chậm trễ từ Ứng viên hoặc Doanh nghiệp (ví dụ: chậm xác nhận phỏng vấn, không biết hồ sơ đã được duyệt) dẫn đến bỏ lỡ cơ hội và làm chậm thời gian tuyển dụng. Chỉ gửi thông báo qua email là chưa đủ vì email dễ rơi vào mục spam. Hệ thống cần trung tâm thông báo đẩy (Push/Web Notifications) tức thời trực tiếp trên giao diện để người dùng phản hồi ngay lập tức.

### 2.2 Mục tiêu module
- Cung cấp cơ chế thông báo đẩy thời gian thực (Real-time Push Notifications) qua SignalR/WebSockets.
- Lưu trữ nhật ký thông báo trên cơ sở dữ liệu để tra cứu lại, hiển thị biểu tượng chuông báo trên thanh Header cùng số lượng tin chưa đọc.
- Hỗ trợ đánh dấu thông báo đã đọc (từng tin hoặc tất cả).

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Mọi người dùng | Nhận thông báo liên quan đến tài khoản của mình | Chỉ xem thông báo của chính mình [BR-01] |

---

## 3. User Stories

### US-01: Nhận thông báo thời gian thực (Real-time Notifications)
**Story**: Là **Người dùng**, tôi muốn **nhận thông báo nổi lập tức khi có sự kiện mới phát sinh** để **kịp thời nắm bắt thông tin**.

**Acceptance Criteria**:
- **Given** Tôi đang mở trình duyệt sử dụng hệ thống.
- **When** Có sự kiện liên quan phát sinh (ví dụ: Nhà tuyển dụng đặt lịch phỏng vấn với tôi, hoặc Ứng viên nộp đơn vào bài đăng của tôi).
- **Then** Một popup thông báo nhỏ xuất hiện ở góc màn hình hiển thị tiêu đề và nội dung tóm tắt, đồng thời số lượng chuông thông báo tăng thêm 1 [BR-03].

### US-02: Xem danh sách và Đọc thông báo
**Story**: Là **Người dùng**, tôi muốn **click vào biểu tượng chuông để xem danh sách các thông báo** để **quản lý lịch sử sự kiện**.

**Acceptance Criteria**:
- **Given** Tôi click vào biểu tượng quả chuông ở Header.
- **When** Hệ thống hiển thị danh sách 10 thông báo gần nhất gồm: Nội dung, thời gian nhận và trạng thái (Đã đọc / Chưa đọc).
- **Then** Khi tôi click vào một tin thông báo cụ thể, hệ thống tự động đổi trạng thái tin đó thành Đã đọc (`is_read = 1`) và điều hướng tôi đến trang nghiệp vụ tương ứng (ví dụ: click thông báo phỏng vấn sẽ mở trang Lịch phỏng vấn).

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | Thông báo có tính riêng tư tuyệt đối. Người dùng chỉ xem được thông báo gửi trực tiếp cho tài khoản của mình (`UserId = CurrentUser.Id`). | Truy vấn thông báo |
| BR-02 | Các loại thông báo (NotificationType) được chia nhóm rõ ràng: `APPLICATION_STATUS` (đổi trạng thái đơn nộp), `INTERVIEW_INVITE` (mời phỏng vấn), `JOB_ALERT` (việc làm gợi ý). | Tạo thông báo |
| BR-03 | Nếu người dùng đang offline tại thời điểm phát sinh sự kiện, thông báo vẫn được lưu vào CSDL và sẽ hiển thị lại dưới dạng "Chưa đọc" khi người dùng đăng nhập trở lại. | Tạo thông báo |
