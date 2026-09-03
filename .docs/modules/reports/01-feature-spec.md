# 01 — Feature Specification: Reports & Analytics

> **Purpose**: Mô tả yêu cầu nghiệp vụ của phân hệ Báo cáo & Thống kê (Reports & Analytics).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `REP` |
| Module name | Reports & Analytics |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Nhà tuyển dụng cần nắm bắt hiệu quả của các tin đăng tuyển dụng (số lượt xem tin, số đơn nộp, tỉ lệ hồ sơ đạt yêu cầu) để tối ưu hóa nội dung mô tả công việc hoặc đổi mới chiến lược tuyển dụng. Quản trị hệ thống (Admin) cần biểu đồ trực quan giám sát lượng người dùng mới đăng ký (Ứng viên & Nhà tuyển dụng) và tổng số lượng giao dịch/tin đăng thành công để đánh giá sức khỏe của nền tảng.

### 2.2 Mục tiêu module
- Cung cấp Dashboard thống kê tuyển dụng trực quan cho Nhà tuyển dụng theo thời gian thực (real-time metrics).
- Cung cấp Dashboard quản trị hệ thống cho Admin (thống kê tổng số tin đăng, ứng viên mới, tỷ lệ ứng tuyển thành công).
- Hỗ trợ xuất file báo cáo Excel số liệu tổng hợp.

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Nhà tuyển dụng (EMPLOYER) | Xem báo cáo hiệu suất các chiến dịch tuyển dụng của công ty | Chỉ xem dữ liệu thống kê của công ty mình [BR-02] |
| Quản trị viên (ADMIN) | Xem báo cáo tổng thể hoạt động sàn | Xem toàn bộ dữ liệu thống kê hệ thống [BR-02] |

---

## 3. User Stories

### US-01: Doanh nghiệp xem Báo cáo Phân tích Tuyển dụng (Recruitment Analytics)
**Story**: Là **Company Owner / HR Manager**, tôi muốn **xem phễu tuyển dụng, nguồn ứng viên và hiệu suất tin đăng** để **đánh giá hiệu quả chiến dịch tuyển dụng**.

**Acceptance Criteria**:
- **Given** Tôi đã đăng nhập vai trò Doanh nghiệp.
- **When** Tôi mở mục Báo cáo & Thống kê tuyển dụng.
- **Then** Hệ thống hiển thị các thông tin:
  - **Recruitment Funnel (Phễu tuyển dụng)**: Views -> Applications -> Shortlisted -> Interviews -> Offers -> Hired (Tính tỷ lệ chuyển đổi Conversion Rate giữa các bước).
  - **Job Performance**: Bảng thống kê chi tiết từng job (Lượt xem, lượt nộp, lượt phỏng vấn, lượt tuyển).
  - **Ứng viên theo Nguồn (Candidate Source)**: Phân bố số đơn nộp từ các nguồn (Organic, Direct, LinkedIn, Facebook, Referral, Ads).
  - **Recruitment Campaign**: Thống kê ngân sách chạy chiến dịch tuyển dụng, chi phí trên mỗi lượt tuyển (Cost per Hire).

### US-02: Báo cáo vi phạm Tin tuyển dụng / Doanh nghiệp (Report Job/Company)
**Story**: Là **Candidate**, tôi muốn **gửi báo cáo vi phạm khi phát hiện tin tuyển dụng lừa đảo hoặc thông tin công ty sai lệch** để **cảnh báo hệ thống**.

**Acceptance Criteria**:
- **Given** Tôi đã đăng nhập và đang xem Job hoặc Company.
- **When** Tôi nhấn nút "Báo cáo vi phạm", chọn lý do: Scam (Lừa đảo), Fake Job (Tin giả), Salary misleading (Lương sai sự thật), Personal information request (Đòi hỏi thông tin cá nhân vô lý), Other (Khác), nhập mô tả chi tiết và nhấn "Gửi".
- **Then** Hệ thống tạo bản ghi báo cáo vi phạm ở trạng thái `PENDING` (Chờ xử lý).

### US-03: Admin xử lý Báo cáo vi phạm (Report Moderation)
**Story**: Là **Admin**, tôi muốn **kiểm duyệt và xử lý các báo cáo vi phạm từ người dùng** để **đảm bảo môi trường tuyển dụng lành mạnh**.

**Acceptance Criteria**:
- **Given** Tôi đăng nhập vai trò Admin và mở Danh sách báo cáo vi phạm.
- **When** Tôi xem xét chi tiết báo cáo và chọn hành động xử lý:
  - **Warning**: Gửi cảnh cáo cho HR/Doanh nghiệp.
  - **Hide/Remove Job**: Ẩn/Xóa tin tuyển dụng vi phạm.
  - **Suspend Company**: Khóa doanh nghiệp (Ẩn toàn bộ tin đăng của họ).
  - **Ban User**: Khóa tài khoản người dùng vi phạm.
- **Then** Trạng thái báo cáo chuyển sang `RESOLVED` (Đã xử lý).

### US-04: Giới hạn gói dịch vụ Doanh nghiệp (Subscription Plans)
**Story**: Là **Company Owner**, tôi muốn **mua gói Subscription (Pro, Business, Enterprise) và kiểm soát giới hạn tài nguyên** để **phục vụ nhu cầu tuyển dụng mở rộng**.

**Acceptance Criteria**:
- **Given** Tôi quản lý phần Billing của công ty.
- **When** Tôi đăng ký gói Subscription (Free, Pro, Business, Enterprise).
- **Then** Hệ thống áp dụng các hạn mức cho tài khoản công ty của tôi [BR-03]:
  - Giới hạn số lượng Job được đăng cùng lúc.
  - Giới hạn lượt xem CV chi tiết của ứng viên trên sàn.
  - Giới hạn tính năng lọc tìm ứng viên nâng cao.
  - Giới hạn tính năng AI Screening hỗ trợ lọc CV.
  - Giới hạn số tài khoản HR được mời tham gia công ty.

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | Khoảng thời gian mặc định của các báo cáo thống kê là 30 ngày gần nhất. Cho phép người dùng tùy chỉnh lọc khoảng ngày. | Truy vấn dữ liệu báo cáo |
| BR-02 | Doanh nghiệp chỉ được xem số liệu tổng hợp thuộc sở hữu của công ty mình. Admin được phép truy cập kho dữ liệu tổng thể hệ thống. | Tạo API truy vấn |
| BR-03 | Khi một gói Subscription hết hạn, hệ thống tự động đưa doanh nghiệp về gói Free, tạm dừng (`PAUSED`) các tin tuyển dụng vượt quá hạn mức cho phép. | Quét gia hạn gói cước |
| BR-04 | Tin tuyển dụng bị xóa (`Remove Job`) hoặc doanh nghiệp bị khóa (`Suspend`) do vi phạm sẽ không tính vào ngân sách báo cáo hiệu quả tuyển dụng. | Thống kê dữ liệu |

