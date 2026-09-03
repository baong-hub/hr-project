# 01 — Feature Specification: Companies Management

> **Purpose**: Mô tả yêu cầu nghiệp vụ của phân hệ Quản lý trang công ty & Thương hiệu doanh nghiệp (Companies Management).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `COM` |
| Module name | Companies Management |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Ứng viên khi tìm việc thường chú trọng uy tín doanh nghiệp và môi trường văn hóa công ty. Việc chỉ đăng tin tuyển dụng thông thường không đủ làm nổi bật thương hiệu tuyển dụng (Employer Branding). Hệ thống cần tách biệt thông tin tài khoản Nhà tuyển dụng cá nhân và thông tin Trang Doanh nghiệp để nhiều Nhà tuyển dụng thuộc cùng một công ty có thể dùng chung thông tin thương hiệu, đồng thời cho phép ứng viên theo dõi công ty để nhận tin tuyển dụng mới.

### 2.2 Mục tiêu module
- Cung cấp trang thông tin doanh nghiệp chi tiết (Logo, Banner, Mô tả, Quy mô, Địa chỉ các cơ sở, Website).
- Cho phép Ứng viên tìm kiếm công ty theo tên, địa điểm, ngành nghề và xem tất cả các tin tuyển dụng đang mở của công ty đó.
- Cung cấp tính năng Theo dõi công ty (Follow Company) để ứng viên chủ động nhận cập nhật việc làm mới.

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Nhà tuyển dụng (EMPLOYER) | Cập nhật thông tin doanh nghiệp mình đại diện | Chỉ sửa được thông tin công ty mình [BR-01] |
| Ứng viên (CANDIDATE) | Tìm kiếm công ty, xem thông tin công ty và theo dõi | Xem thông tin công khai của tất cả các công ty |

---

## 3. User Stories

### US-01: Cập nhật Trang thông tin Doanh nghiệp
**Story**: Là **Company Owner / HR Manager**, tôi muốn **cập nhật đầy đủ hồ sơ thông tin doanh nghiệp** để **xây dựng thương hiệu tuyển dụng chuyên nghiệp trên sàn**.

**Acceptance Criteria**:
- **Given** Tôi đã đăng nhập và có vai trò `COMPANY_OWNER` hoặc `HR_MANAGER` liên kết với doanh nghiệp [BR-01].
- **When** Tôi thực hiện cập nhật các trường thông tin: 
  - Tên doanh nghiệp (Company Name), Logo, Ảnh bìa (Cover Image) [BR-02]
  - Mã số thuế (Tax Code), Website, Ngành nghề (Industry), Quy mô (Company Size), Năm thành lập (Founded Year)
  - Địa chỉ các văn phòng (Address), Mô tả chi tiết (Description)
  - Phúc lợi (Benefits), Thông tin liên hệ (Contact), Các liên kết mạng xã hội (Social Links)
  và nhấn nút "Lưu".
- **Then** Hệ thống cập nhật thông tin hồ sơ và lưu trạng thái thành công.

### US-02: Tìm kiếm và xem chi tiết Doanh nghiệp
**Story**: Là **Ứng viên**, tôi muốn **tìm kiếm và xem trang công ty công khai** để **tìm hiểu môi trường làm việc và theo dõi tin tuyển dụng**.

**Acceptance Criteria**:
- **Given** Tôi ở trang Danh sách doanh nghiệp.
- **When** Tôi lọc theo từ khóa, ngành nghề, địa điểm, quy mô.
- **Then** Hệ thống hiển thị các doanh nghiệp khớp điều kiện (Đã xác minh `VERIFIED`).
- **When** Tôi click vào một Doanh nghiệp.
- **Then** Hệ thống hiển thị chi tiết hồ sơ công ty và toàn bộ tin tuyển dụng đang hiển thị công khai (`PUBLISHED`) của công ty đó.

### US-03: Theo dõi doanh nghiệp (Follow Company)
**Story**: Là **Ứng viên**, tôi muốn **theo dõi các công ty yêu thích** để **tự động nhận thông báo khi có tin tuyển dụng mới**.

**Acceptance Criteria**:
- **Given** Tôi đang xem trang công ty và đã đăng nhập tài khoản Ứng viên [BR-03].
- **When** Tôi bấm nút "Theo dõi".
- **Then** Hệ thống lưu liên kết theo dõi, chuyển nút thành "Đang theo dõi" và tăng số lượt follow. Khi doanh nghiệp đăng tin tuyển dụng mới, hệ thống tự động gửi thông báo đẩy (Notification) và Email cho tôi.

### US-04: Đệ trình hồ sơ xác minh Doanh nghiệp (Company Verification)
**Story**: Là **Company Owner**, tôi muốn **gửi hồ sơ pháp lý kèm giấy tờ chứng minh doanh nghiệp** để **Admin kiểm duyệt tài khoản**.

**Acceptance Criteria**:
- **Given** Hồ sơ doanh nghiệp ở trạng thái nháp (`DRAFT`).
- **When** Tôi cập nhật đầy đủ thông tin bắt buộc (Mã số thuế, Giấy phép đăng ký kinh doanh...) và nhấn "Gửi xác minh".
- **Then** Trạng thái doanh nghiệp chuyển sang `PENDING_VERIFICATION`, đồng thời tạo thông báo chờ duyệt cho Admin.

### US-05: Kiểm duyệt Doanh nghiệp (Admin Review)
**Story**: Là **Admin**, tôi muốn **phê duyệt, yêu cầu bổ sung thông tin hoặc từ chối hồ sơ xác minh doanh nghiệp** để **đảm bảo uy tín hệ thống**.

**Acceptance Criteria**:
- **Given** Tôi đăng nhập vai trò Admin và mở danh sách doanh nghiệp chờ duyệt.
- **When** Tôi kiểm tra hồ sơ và chọn một trong các hành động:
  - **Approve**: Trạng thái chuyển sang `VERIFIED`. Doanh nghiệp được phép hoạt động bình thường.
  - **Reject**: Nhập lý do từ chối. Trạng thái chuyển sang `REJECTED`. Doanh nghiệp nhận email thông báo và có thể sửa đổi đệ trình lại.
  - **Suspend**: Khóa doanh nghiệp do vi phạm. Trạng thái chuyển sang `SUSPENDED`. Ẩn toàn bộ tin đăng của doanh nghiệp.

### US-06: Phân quyền nội bộ Employer (Multi-HR / RBAC)
**Story**: Là **Company Owner**, tôi muốn **thêm tài khoản nhân sự HR vào công ty và gán vai trò tương ứng** để **phân chia trách nhiệm tuyển dụng**.

**Acceptance Criteria**:
- **Given** Tôi là Owner doanh nghiệp.
- **When** Tôi mời nhân sự bằng email và gán vai trò: `HR_MANAGER`, `RECRUITER`, hoặc `HIRING_MANAGER`.
- **Then** Nhân viên mới nhận email kích hoạt, sau khi kích hoạt tài khoản của họ được liên kết với `CompanyId` chung và được phân quyền truy cập ATS theo đúng vai trò [BR-04].

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | Chỉ tài khoản nhà tuyển dụng có vai trò quản lý doanh nghiệp (`COMPANY_OWNER`, `HR_MANAGER`) mới được phép chỉnh sửa thông tin doanh nghiệp. | Cập nhật thông tin doanh nghiệp |
| BR-02 | Logo tải lên định dạng hình ảnh (.jpg, .png, .webp) dung lượng <= 2MB. Ảnh bìa (Banner) dung lượng <= 5MB. | Cập nhật hình ảnh doanh nghiệp |
| BR-03 | Chỉ ứng viên đã đăng nhập hệ thống mới được sử dụng tính năng theo dõi doanh nghiệp. | Theo dõi công ty |
| BR-04 | Phân quyền RBAC nội bộ công ty: `Company Owner` được toàn quyền quản trị; `HR Manager` quản lý job & ATS; `Recruiter` sàng lọc & đặt lịch; `Hiring Manager` đánh giá chuyên môn ứng viên. | Mọi thao tác trong hệ thống Employer |
| BR-05 | Doanh nghiệp bị khóa (`SUSPENDED`) sẽ lập tức ẩn toàn bộ tin tuyển dụng đang mở khỏi trang tìm kiếm của ứng viên. | Admin khóa công ty |
