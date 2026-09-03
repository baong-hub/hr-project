# 01 — Feature Specification: Job Applications

> **Purpose**: Mô tả yêu cầu nghiệp vụ của phân hệ Ứng tuyển & Duyệt hồ sơ (Job Applications).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `APP` |
| Module name | Job Applications |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Ứng viên cần nộp CV nhanh chóng cho các tin tuyển dụng đang hoạt động. Nhà tuyển dụng cũng cần công cụ quản lý tập trung các đơn ứng tuyển đổ về, cho phép lọc theo tin tuyển dụng, xem nội dung thư xin việc (cover letter), mở trực tiếp tệp CV và cập nhật trạng thái đơn ứng tuyển (Đang duyệt, Hẹn phỏng vấn, Từ chối, Nhận việc) để cả doanh nghiệp và ứng viên đều dễ dàng theo dõi tiến độ.

### 2.2 Mục tiêu module
- Cho phép Ứng viên nộp đơn ứng tuyển kèm bản CV (đã tải lên từ trước hoặc đăng tải mới) và thư xin việc.
- Cung cấp trang Quản lý đơn ứng tuyển dành riêng cho Doanh nghiệp để quản lý hồ sơ theo từng tin tuyển dụng.
- Tự động hóa gửi thông báo (email) khi có đơn ứng tuyển mới và cập nhật trạng thái đơn tuyển dụng.

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Ứng viên (CANDIDATE) | Nộp hồ sơ ứng tuyển, xem lịch sử ứng tuyển | Chỉ đơn ứng tuyển của bản thân |
| Nhà tuyển dụng (EMPLOYER) | Xem danh sách nộp đơn, duyệt hồ sơ ứng viên, đổi trạng thái | Chỉ xem các đơn ứng tuyển nộp vào tin đăng của doanh nghiệp mình |

---

## 3. User Stories

### US-01: Nộp hồ sơ ứng tuyển (Job Apply)
**Story**: Là **Ứng viên**, tôi muốn **chọn một bản CV để nộp đơn ứng tuyển vào một tin tuyển dụng đang mở** để **nhân sự HR xét duyệt hồ sơ**.

**Acceptance Criteria**:
- **Given** Tôi đã đăng nhập tài khoản Ứng viên.
- **When** Tôi nhấn "Ứng tuyển" tại trang chi tiết tin tuyển dụng:
  - Hệ thống kiểm tra xem tôi đã nộp đơn vào công việc này chưa [BR-01].
  - Kiểm tra xem tin tuyển dụng có đang mở (`PUBLISHED` và chưa quá hạn ExpiredAt) không [BR-02].
  - Kiểm tra xem tôi đã tải lên hoặc tạo ít nhất một bản CV chưa [BR-03].
  - Nếu tất cả hợp lệ, hệ thống mở modal cho phép tôi chọn CV (mặc định chọn CV mặc định) và nhập Thư xin việc (Cover Letter) tùy chọn, sau đó nhấn "Nộp hồ sơ".
- **Then** Hệ thống tạo bản ghi đơn ứng tuyển với trạng thái khởi đầu là `APPLIED`, gửi thông báo SignalR / Email cho HR của công ty sở hữu Job.

### US-02: Nhà tuyển dụng quản lý đơn ứng tuyển (Employer ATS Portal)
**Story**: Là **HR Manager / Recruiter**, tôi muốn **xem danh sách hồ sơ nộp vào và quản lý theo quy trình ATS** để **dễ dàng phân loại và lọc ứng viên**.

**Acceptance Criteria**:
- **Given** Tôi đăng nhập với tư cách nhân viên HR của công ty.
- **When** Tôi mở trang quản lý ATS của một tin tuyển dụng cụ thể.
- **Then** Hệ thống hiển thị các cột trạng thái tương ứng với quy trình: `APPLIED` -> `SCREENING` -> `SHORTLISTED` -> `INTERVIEW` -> `OFFER` -> `HIRED`.
- **When** Tôi di chuyển ứng viên qua các bước hoặc xem thông tin chi tiết ứng viên (CV, profile, cover letter, ghi chú nội bộ).
- **Then** Hệ thống lưu tiến trình tương ứng của ứng viên.

### US-03: Sàng lọc và Cập nhật trạng thái Đơn ứng tuyển
**Story**: Là **HR Manager / Recruiter**, tôi muốn **sàng lọc hồ sơ ứng viên và chuyển trạng thái đơn ứng tuyển** để **bước tiếp sang các quy trình tiếp theo**.

**Acceptance Criteria**:
- **Given** Tôi đang xem đơn ứng tuyển của ứng viên ở trạng thái `APPLIED`.
- **When** Tôi nhấn "Bắt đầu sàng lọc".
- **Then** Trạng thái chuyển sang `SCREENING`. Hệ thống hiển thị danh sách so khớp (Experience, Skills, Education, Salary expectation, Location) [US-05].
- **When** Tôi xác nhận đạt yêu cầu sơ tuyển và nhấn "Đưa vào danh sách tiềm năng".
- **Then** Trạng thái chuyển sang `SHORTLISTED`. Hệ thống tự động kích hoạt thông báo cho ứng viên: "Hồ sơ của bạn đã được đưa vào danh sách ứng viên tiềm năng".
- **When** Tại bất kỳ bước nào tôi thấy ứng viên không đạt và nhấn "Từ chối".
- **Then** Trạng thái chuyển sang `REJECTED`. Hệ thống kích hoạt gửi email thông báo từ chối lịch sự cho ứng viên.

### US-04: Rút hồ sơ ứng tuyển (Withdraw Application)
**Story**: Là **Ứng viên**, tôi muốn **chủ động rút hồ sơ ứng tuyển của mình** để **không tiếp tục tham gia quy trình tuyển dụng của job đó nữa**.

**Acceptance Criteria**:
- **Given** Tôi đang ở trang lịch sử ứng tuyển cá nhân.
- **When** Tôi chọn đơn ứng tuyển đang xử lý và nhấn "Rút hồ sơ" [BR-06].
- **Then** Trạng thái đơn chuyển sang `WITHDRAWN`. HR sẽ không thể thực hiện các thao tác xử lý ATS tiếp theo đối với hồ sơ này.

### US-05: Điểm số hóa Hồ sơ tự động (Candidate Scoring)
**Story**: Là **Recruiter / Hiring Manager**, tôi muốn **xem điểm số hóa hồ sơ ứng viên so với Job** để **nhanh chóng nhận biết độ phù hợp của hồ sơ**.

**Acceptance Criteria**:
- **Given** Tôi đang xem chi tiết đơn ứng tuyển của ứng viên.
- **Then** Hệ thống tự động tính toán điểm số phù hợp (Match Score) trên thang điểm 100 theo cơ cấu trọng số:
  - Kinh nghiệm làm việc (Experience): 25% (So khớp số năm kinh nghiệm yêu cầu).
  - Kỹ năng (Skills): 40% (So khớp các kỹ năng công nghệ chính trong Job).
  - Trình độ học vấn (Education): 10% (So khớp bằng cấp, chuyên ngành).
  - Mức lương kỳ vọng (Salary Expectation): 10% (Nằm trong ngân sách Job).
  - Địa điểm (Location): 5% (Gần văn phòng làm việc).
  - Các yếu tố khác (Other): 10% (Mô tả, ngôn ngữ...).
  và hiển thị kết quả chi tiết dạng phần trăm (ví dụ: 92/100).

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | Một ứng viên chỉ được phép nộp hồ sơ ứng tuyển duy nhất 1 lần vào 1 tin tuyển dụng. Chặn các yêu cầu nộp đơn trùng lặp. | Nộp hồ sơ ứng tuyển |
| BR-02 | Ứng viên không được phép nộp đơn ứng tuyển vào các tin tuyển dụng ở trạng thái không phải `PUBLISHED` hoặc đã hết hạn (`ExpiredAt < Now`). | Nộp hồ sơ ứng tuyển |
| BR-03 | Ứng viên bắt buộc phải có ít nhất 1 bản CV trong hệ thống để thực hiện ứng tuyển. | Nộp hồ sơ ứng tuyển |
| BR-04 | Chỉ nhân sự HR thuộc công ty sở hữu Job mới được quyền xem và cập nhật trạng thái đơn ứng tuyển của Job đó. | Quản lý ATS |
| BR-05 | Khi đơn ứng tuyển được HR cập nhật trạng thái hoặc chuyển bước trong ATS, hệ thống phải ghi log lịch sử trạng thái kèm thời gian và người thực hiện. | Cập nhật trạng thái |
| BR-06 | Ứng viên chỉ được rút hồ sơ khi trạng thái hiện tại chưa đạt tới `HIRED` hoặc `REJECTED`. | Rút hồ sơ |

