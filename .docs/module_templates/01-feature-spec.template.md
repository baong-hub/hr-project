# 01 — Feature Specification: {{MODULE_NAME}}

> **Purpose**: Mô tả yêu cầu **nghiệp vụ** của module. Không chứa chi tiết kỹ thuật (DB, API, code).
> **Owner**: PM / BA
> **Readers**: Dev, QA, Stakeholder  
> **Related files**: `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md`, `05-test-plan.md`

<!-- 
HƯỚNG DẪN ĐIỀN FILE NÀY:
1. Đọc ARCHITECTURE.md + CONVENTIONS.md trước khi điền.
2. Viết ngôn ngữ nghiệp vụ, KHÔNG viết về kỹ thuật (bảng DB, endpoint...).
3. Mỗi User Story phải có Acceptance Criteria rõ ràng (dạng Given-When-Then).
4. Business Rule phải đánh số (BR-01, BR-02...) để 02-05 tham chiếu được.
5. Nếu có nghi vấn/chưa rõ, cho vào mục "Open Questions", KHÔNG tự bịa.
-->

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `{{MODULE_CODE}}` (ví dụ: `APP` cho Appointment) |
| Module name | {{MODULE_NAME}} |
| Version | 1.0 |
| Status | Draft / In Review / Approved |
| Author | {{AUTHOR}} |
| Created date | YYYY-MM-DD |
| Last updated | YYYY-MM-DD |

---

## 2. Bối cảnh nghiệp vụ

<!-- 3-5 đoạn trả lời: Module này giải quyết vấn đề gì? Ai dùng? Tần suất dùng? -->

### 2.1 Vấn đề
{{Mô tả vấn đề hiện tại. Ví dụ: "Lễ tân hiện tại ghi lịch hẹn trên giấy, khó tra cứu, dễ trùng..."}}

### 2.2 Mục tiêu module
{{Liệt kê 3-5 mục tiêu chính, dạng đo lường được nếu có thể. Ví dụ: "Giảm thời gian đặt lịch xuống <1 phút/ca"}}

### 2.3 Người dùng liên quan (Personas)

| Role | Mô tả | Scope data nhìn thấy |
|------|-------|---------------------|
| {{Role1}} | {{Ví dụ: Lễ tân — đặt lịch cho khách hàng đến quầy}} | {{Ví dụ: lịch của tất cả bác sĩ trong ngày}} |
| {{Role2}} | {{Ví dụ: Telesale — đặt lịch qua điện thoại}} | {{Ví dụ: lịch do mình tạo}} |
| {{Role3}} | {{Ví dụ: Bác sĩ}} | {{Ví dụ: lịch của chính mình}} |
| {{Role4}} | {{Ví dụ: Trưởng khoa}} | {{Ví dụ: lịch của toàn khoa}} |

---

## 3. User Stories

<!-- 
Format chuẩn: "Là [role], tôi muốn [action] để [value]."
Mỗi story có ID (US-01, US-02...) để các file sau tham chiếu.
Mỗi story có Acceptance Criteria dạng Given-When-Then.
-->

### US-01: {{Tên ngắn gọn}}
**Story**: Là **{{role}}**, tôi muốn **{{action}}** để **{{value}}**.

**Acceptance Criteria**:
- **Given** {{điều kiện tiền đề}}
- **When** {{hành động của user}}
- **Then** {{kết quả mong đợi}}

**Ví dụ**:
> US-01: Tạo lịch hẹn mới  
> Là **Lễ tân**, tôi muốn **tạo lịch hẹn cho khách hàng** để **khách hàng đến khám đúng giờ với bác sĩ đã chọn**.  
> - Given tôi đã đăng nhập với quyền `appointment:create`  
> - When tôi nhập đủ thông tin (khách hàng, bác sĩ, thời gian) và nhấn Lưu  
> - Then hệ thống tạo lịch hẹn với trạng thái `SCHEDULED` và hiển thị trên lịch

### US-02: {{...}}
...

### US-03: {{...}}
...

<!-- Thêm story đủ để phủ hết các chức năng trong scope. Không quá 15 stories/module. -->

---

## 4. Business Rules

<!-- 
Rule có thể áp dụng cho nhiều use case. Đánh số BR-01, BR-02...
Các file sau (02, 03, 05) sẽ tham chiếu rule theo số.
-->

| ID | Rule | Áp dụng khi |
|----|------|-------------|
| BR-01 | {{Ví dụ: Một bác sĩ không thể có 2 lịch hẹn chồng khung giờ}} | Tạo/cập nhật lịch hẹn |
| BR-02 | {{Ví dụ: Không đặt lịch trong quá khứ (< thời điểm hiện tại)}} | Tạo lịch hẹn |
| BR-03 | {{Ví dụ: Chỉ hủy được lịch ở trạng thái SCHEDULED hoặc CONFIRMED}} | Xóa lịch hẹn |
| BR-04 | {{Ví dụ: Lịch ở trạng thái COMPLETED không được sửa}} | Cập nhật lịch |
| BR-05 | {{...}} | {{...}} |

---

## 5. State / Status (nếu có)

<!-- 
Nếu entity chính có state machine, vẽ ra đây.
Nếu không có state phức tạp thì xóa section này.
-->

### 5.1 Các trạng thái
| Status code | Mô tả | Ai set được |
|-------------|-------|------------|
| `SCHEDULED` | Lịch hẹn đã đặt, chưa confirm | Hệ thống (khi tạo) |
| `CONFIRMED` | Khách hàng đã xác nhận | Lễ tân, Telesale |
| `CANCELLED` | Lịch hẹn bị hủy | Lễ tân, khách hàng tự hủy |
| `COMPLETED` | Đã khám xong | Hệ thống (khi khám xong) |

### 5.2 Chuyển trạng thái cho phép

```
SCHEDULED  ──▶ CONFIRMED  ──▶ COMPLETED
    │              │
    ▼              ▼
CANCELLED      CANCELLED
```

Từ `CANCELLED` hoặc `COMPLETED` → **không được** chuyển đi đâu.

---

## 6. Scope & Không thuộc scope

### 6.1 Trong scope (phase này)
- [ ] {{Ví dụ: Tạo, sửa, xóa, xem lịch hẹn}}
- [ ] {{Ví dụ: Xem lịch theo dạng calendar (day/week/month)}}
- [ ] {{Ví dụ: Check trùng lịch bác sĩ}}

### 6.2 KHÔNG thuộc scope (ghi rõ để tránh hiểu nhầm)
- [ ] {{Ví dụ: Gửi SMS nhắc lịch — sẽ làm ở phase 2}}
- [ ] {{Ví dụ: Đặt lịch recurring (lịch định kỳ)}}
- [ ] {{Ví dụ: Đặt lịch theo nhóm nhiều bệnh nhân}}

---

## 7. Dependencies

### 7.1 Dependency nghiệp vụ
<!-- Module này cần dữ liệu/chức năng của module nào khác? -->

| Phụ thuộc vào | Mục đích | Trạng thái |
|---------------|----------|-----------|
| Master Data: `patients` | Chọn khách hàng khi đặt lịch | Migrate từ HIS cũ |
| Master Data: `users` | Chọn bác sĩ, xác định người tạo | Migrate từ HIS cũ |
| Master Data: `departments` | Chọn khoa/phòng | Migrate từ HIS cũ |
| Master Data: `services` | Chọn dịch vụ khám | Migrate từ HIS cũ |
| Module Auth | Đăng nhập, phân quyền | Đã có |

### 7.2 Dependency kỹ thuật
<!-- Chỉ liệt kê nếu ĐẶC THÙ module. Những thứ chuẩn (DB, API...) không cần ghi. -->
- {{Ví dụ: Cần thư viện FullCalendar cho FE để vẽ calendar view}}

---

## 8. Permission

<!-- 
Dựa trên CONVENTIONS.md section 2/6. Format: module_code:action.
Mỗi permission phải ánh xạ đến user story nào.
-->

| Permission code | Mô tả | US áp dụng |
|-----------------|-------|-----------|
| `appointment:create` | Tạo lịch hẹn | US-01 |
| `appointment:view` | Xem lịch hẹn do mình tạo/được phân | US-05 |
| `appointment:view_all` | Xem tất cả lịch hẹn (trong phạm vi khoa / toàn hệ thống) | US-06 |
| `appointment:update` | Cập nhật lịch hẹn | US-02 |
| `appointment:cancel` | Hủy lịch hẹn | US-03 |
| `appointment:delete` | Xóa (soft) lịch hẹn — dành cho admin | US-04 |

**Scope data mặc định** (khi chỉ có `:view` mà không có `:view_all`):
{{Ví dụ: "User chỉ xem được lịch hẹn có `created_by = currentUser.id` hoặc `doctor_id = currentUser.id`"}}

---

## 9. Non-functional requirements

### 9.1 Performance
- {{Ví dụ: Calendar view load < 1s với 500 lịch hẹn/tháng}}
- {{Ví dụ: API list paginate tối đa 100 records/page}}

### 9.2 Usability
- {{Ví dụ: Form tạo lịch không quá 1 màn hình (không phải scroll)}}
- {{Ví dụ: Hỗ trợ keyboard shortcut cho lễ tân dùng nhanh}}

### 9.3 Ngôn ngữ
- Giao diện: Tiếng Việt
- Error message: Tiếng Việt (cho user), Error code: tiếng Anh (cho dev)

---

## 10. Open Questions

<!-- 
Ghi lại câu hỏi CHƯA có câu trả lời. Không tự bịa giả định.
Khi chuyển sang "In Review" phải giải quyết hết các câu hỏi ở đây.
-->

- [ ] {{Ví dụ: Bệnh nhân có được tự đặt lịch online không hay chỉ lễ tân/telesale?}}
- [ ] {{Ví dụ: Lịch hẹn có cần gán phòng cụ thể không hay chỉ cần khoa?}}
- [ ] {{Ví dụ: Một lịch hẹn có bao giờ có nhiều bác sĩ không?}}

---

## 11. Glossary (thuật ngữ nghiệp vụ)

<!-- Giải thích các thuật ngữ chuyên ngành mà dev/AI có thể không hiểu. -->

| Thuật ngữ | Giải thích |
|-----------|------------|
| {{Lịch hẹn}} | {{Khoảng thời gian được block trước để bệnh nhân đến khám với một bác sĩ cụ thể}} |
| {{Walk-in}} | {{Khách đến không hẹn trước, khác với appointment}} |

---

## 12. Checklist hoàn thành

Trước khi chuyển status sang **Approved**, BA/PO phải đảm bảo:

- [ ] Mọi user story có đủ Acceptance Criteria
- [ ] Business Rules được đánh số rõ ràng
- [ ] Mục "Không thuộc scope" đã được stakeholder đọc và xác nhận
- [ ] Không còn Open Questions chưa giải quyết
- [ ] Dev lead đã review và feasible về kỹ thuật
- [ ] Permission matrix đã align với CONVENTIONS.md
