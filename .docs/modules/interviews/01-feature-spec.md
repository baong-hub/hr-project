# 01 — Feature Specification: Interview Scheduling

> **Purpose**: Mô tả yêu cầu nghiệp vụ của phân hệ Lịch hẹn phỏng vấn (Interview Scheduling).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `INT` |
| Module name | Interview Scheduling |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Created date | 2026-08-19 |
| Last updated | 2026-08-19 |

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề
Khi lọc được ứng viên phù hợp (Shortlisted), Nhà tuyển dụng cần đặt lịch hẹn phỏng vấn (trực tiếp hoặc trực tuyến qua Zoom/Meet) với ứng viên. Quy trình liên hệ thủ công qua điện thoại dễ xảy ra sai lệch múi giờ, quên lịch. Do đó, hệ thống cần một tính năng lên lịch phỏng vấn đồng bộ, tự động gửi thư mời cho Ứng viên, cho phép Ứng viên bấm xác nhận tham gia hoặc đề xuất dời lịch, và lên lịch nhắc nhở trước giờ phỏng vấn.

### 2.2 Mục tiêu module
- Hỗ trợ Nhà tuyển dụng lên lịch phỏng vấn (thời gian, hình thức, địa điểm/link họp) liên kết trực tiếp với Đơn ứng tuyển của ứng viên.
- Cho phép Ứng viên nhận thông báo, xem lịch phỏng vấn và gửi phản hồi (Đồng ý/Từ chối).
- Tự động lên lịch tác vụ nền nhắc lịch phỏng vấn qua email trước 2 tiếng.

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| Nhà tuyển dụng (EMPLOYER) | Lên lịch phỏng vấn, cập nhật kết quả phỏng vấn | Xem các lịch hẹn do công ty mình lên lịch |
| Ứng viên (CANDIDATE) | Xem lịch hẹn, xác nhận/từ chối lời mời phỏng vấn | Chỉ xem lịch hẹn của bản thân |

---

## 3. User Stories

### US-01: Lên lịch phỏng vấn theo vòng (Schedule Interview Round)
**Story**: Là **HR Manager / Recruiter**, tôi muốn **lên lịch hẹn phỏng vấn cho một vòng tuyển dụng của ứng viên** để **tiến hành đánh giá theo quy trình nhiều vòng (Multi-round)**.

**Acceptance Criteria**:
- **Given** Đơn ứng tuyển của ứng viên đang ở trạng thái `SHORTLISTED` hoặc `INTERVIEW`.
- **When** Tôi tạo lịch hẹn phỏng vấn mới, chọn các thông số:
  - **Round**: Vòng phỏng vấn (ví dụ: Round 1: HR Screening, Round 2: Technical Interview, Round 3: Live Coding...).
  - **Interviewer**: Chọn người phỏng vấn (HR / Hiring Manager).
  - **Type**: ONLINE, OFFLINE, hoặc PHONE.
  - **Schedule**: Date, Start Time, Duration (thời lượng).
  - **Location/Link**: Địa điểm văn phòng hoặc Link họp trực tuyến (Google Meet/Zoom).
  - **Notes**: Ghi chú chuẩn bị cho ứng viên.
  và bấm "Gửi lời mời".
- **Then** Hệ thống tạo bản ghi vòng phỏng vấn với trạng thái ban đầu là `INTERVIEW_INVITATION`, gửi email và thông báo đẩy cho ứng viên.

### US-02: Ứng viên phản hồi lời mời phỏng vấn
**Story**: Là **Ứng viên**, tôi muốn **chấp nhận hoặc từ chối lời mời phỏng vấn từ HR** để **tiện sắp xếp lịch trình**.

**Acceptance Criteria**:
- **Given** Tôi nhận được lời mời phỏng vấn (`INTERVIEW_INVITATION`).
- **When** Tôi nhấn "Chấp nhận" (Accept) hoặc "Từ chối" (Decline, yêu cầu nhập lý do).
- **Then** Trạng thái lịch hẹn chuyển sang `INTERVIEW_SCHEDULED` (nếu đồng ý) hoặc `DECLINED` (nếu từ chối). Hệ thống gửi thông báo cho HR để cập nhật hoặc lên lịch lại.

### US-03: Đánh giá kết quả Phỏng vấn (Interview Evaluation)
**Story**: Là **Interviewer / Hiring Manager**, tôi muốn **nhập biểu mẫu đánh giá sau buổi phỏng vấn** để **quyết định chuyển tiếp ứng viên**.

**Acceptance Criteria**:
- **Given** Buổi phỏng vấn đã diễn ra (trạng thái chuyển thành `INTERVIEW_COMPLETED`).
- **When** Tôi mở biểu mẫu đánh giá và chấm điểm (thang điểm 10) các tiêu chí:
  - Technical Skill (Kỹ năng chuyên môn)
  - Communication (Khả năng giao tiếp)
  - Problem Solving (Giải quyết vấn đề)
  - Experience (Độ phù hợp kinh nghiệm)
  - Culture Fit (Độ phù hợp văn hóa)
  - Salary Expectation (Kỳ vọng lương)
  Nhập đánh giá chung (Overall comment) và tự động tính điểm trung bình (Overall Score).
  Chọn kết quả đề xuất: `PASS` (Đạt vòng này), `FAIL` (Loại), hoặc `NEXT_ROUND` (Vào vòng kế tiếp).
  Nhấn "Hoàn tất đánh giá".
- **Then** Hệ thống lưu kết quả đánh giá, cập nhật trạng thái vòng phỏng vấn thành `EVALUATION`.

### US-04: Đánh giá Bài kiểm tra kỹ thuật (Technical Test Assessment)
**Story**: Là **Hiring Manager**, tôi muốn **gửi và chấm điểm bài kiểm tra kỹ thuật (Coding Test/System Design)** để **đo lường chính xác năng lực thực chiến của ứng viên**.

**Acceptance Criteria**:
- **Given** Ứng viên ở vòng kiểm tra kỹ thuật.
- **When** Tôi gửi đề bài (Thời lượng làm bài, số lượng câu hỏi/yêu cầu) và sau đó chấm điểm (ví dụ: 85/100) và chọn trạng thái `PASSED` hoặc `FAILED`.
- **Then** Hệ thống lưu trữ thông tin kiểm tra kỹ thuật và ghi nhận kết quả trong tiến trình phỏng vấn của đơn ứng tuyển.

---

## 4. Business Rules

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | Thời gian phỏng vấn được đặt bắt buộc phải lớn hơn thời điểm hiện tại (`StartTime > Now`). | Tạo lịch phỏng vấn |
| BR-02 | Lịch phỏng vấn chỉ được tạo khi đơn ứng tuyển chưa bị `REJECTED` hoặc `WITHDRAWN`. | Tạo lịch phỏng vấn |
| BR-03 | Khi lịch phỏng vấn đạt trạng thái `INTERVIEW_SCHEDULED`, hệ thống tự động đăng ký tác vụ nền Hangfire gửi email nhắc nhở cho cả Interviewer và Candidate trước giờ hẹn 2 tiếng. | Xác nhận lịch hẹn |
| BR-04 | Đơn ứng tuyển chỉ được chuyển sang bước đề xuất Offer (`OFFER`) sau khi đã hoàn thành và đạt (`PASS`) tất cả các vòng phỏng vấn & kiểm tra kỹ thuật bắt buộc của tin tuyển dụng đó. | Tạo Offer |

