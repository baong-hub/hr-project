# 02 — Data Model: {{MODULE_NAME}}

> **Purpose**: Thiết kế database và entity cho module. Là đầu vào để AI sinh migration, entity class, EF configuration.  
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md` đã Approved.  
> **Related files**: `03-api-contract.md` sẽ tham chiếu DTO dựa trên entity ở đây.

<!-- 
HƯỚNG DẪN ĐIỀN FILE NÀY:
1. Đọc CONVENTIONS.md section 1 (Database Conventions) trước khi điền.
2. Mọi bảng đều PHẢI có 6 audit columns (xem CONVENTIONS.md 1.3). KHÔNG liệt kê lại ở từng bảng, chỉ ghi "Có audit columns" hoặc đánh dấu bảng nào KHÔNG cần audit.
3. Mỗi entity có ID cố định (E-01, E-02...) để file 03 tham chiếu.
4. Khi tham chiếu Business Rule từ 01, dùng format [BR-01], [BR-02].
5. KHÔNG viết code C#, chỉ viết schema + mô tả. AI sẽ sinh code từ file này.
-->

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `{{MODULE_CODE}}` |
| Version | 1.0 |
| Status | Draft / In Review / Approved |
| Author | {{AUTHOR}} |
| Last updated | YYYY-MM-DD |

---

## 2. Sơ đồ ERD (high-level)

<!-- 
Vẽ sơ đồ quan hệ giữa các bảng dùng ASCII hoặc Mermaid.
Chỉ vẽ bảng thuộc module này. Bảng master data (patients, users...) vẽ với border đứt nét.
-->

```
┌────────────┐          ┌──────────────────────┐          ┌────────────┐
│ patients   │ 1      N │ appointments (E-01)  │ N      1 │ users      │
│ (master)   ├─────────▶│                      │◀─────────┤ (doctor)   │
└────────────┘          └──────────┬───────────┘          └────────────┘
                                   │ N
                                   │
                                   ▼ 1
                           ┌───────────────┐
                           │ departments   │
                           │ (master)      │
                           └───────────────┘
```

---

## 3. Danh sách entity

| ID | Entity | Bảng DB | Loại | Ghi chú |
|----|--------|---------|------|---------|
| E-01 | Appointment | `appointments` | Main | Entity chính của module |
| E-02 | AppointmentStatusHistory | `appointment_status_histories` | Sub | Lưu lịch sử đổi trạng thái (nếu có) |

<!-- 
Loại:
- Main: entity nghiệp vụ chính của module
- Sub: entity phụ trợ (history, log, junction table...)
- Lookup: bảng tra cứu (nếu không dùng enum)
-->

---

## 4. Chi tiết từng entity

### 4.1 E-01: Appointment (`appointments`)

**Mô tả**: Lịch hẹn khám bệnh, liên kết một bệnh nhân với một bác sĩ tại một khung giờ.

**Tham chiếu**: [BR-01], [BR-02], [BR-03], [BR-04] trong `01-feature-spec.md`.

**Columns**:

| Column | Type | Null | Default | Mô tả | Ràng buộc |
|--------|------|------|---------|-------|-----------|
| `id` | `BIGINT UNSIGNED` | NO | AUTO_INCREMENT | PK | PK |
| `patient_id` | `BIGINT UNSIGNED` | NO | — | FK → `patients.id` | FK |
| `doctor_id` | `BIGINT UNSIGNED` | NO | — | FK → `users.id` (role=Doctor) | FK |
| `department_id` | `BIGINT UNSIGNED` | NO | — | FK → `departments.id` | FK |
| `service_id` | `BIGINT UNSIGNED` | YES | NULL | FK → `services.id` | FK, nullable |
| `start_time` | `DATETIME(6)` | NO | — | Thời điểm bắt đầu (UTC) | [BR-02] |
| `end_time` | `DATETIME(6)` | NO | — | Thời điểm kết thúc (UTC) | `end_time > start_time` |
| `status` | `VARCHAR(30)` | NO | `'SCHEDULED'` | Trạng thái lịch hẹn | enum: SCHEDULED, CONFIRMED, CANCELLED, COMPLETED |
| `note` | `TEXT` | YES | NULL | Ghi chú tự do | max 2000 ký tự (validate ở app layer) |
| *audit columns (6)* | — | — | — | Xem CONVENTIONS.md 1.3 | — |

**Enum `status`** (lưu dưới dạng VARCHAR):
- `SCHEDULED` — đã đặt, chưa confirm
- `CONFIRMED` — khách đã xác nhận
- `CANCELLED` — đã hủy
- `COMPLETED` — đã khám xong

Xem state machine ở `01-feature-spec.md` section 5.

**Indexes**:

| Index name | Columns | Loại | Mục đích |
|-----------|---------|------|---------|
| `idx_appointments_start_time` | `start_time` | Normal | Query theo ngày |
| `idx_appointments_doctor_start` | `doctor_id, start_time` | Normal | Check trùng lịch bác sĩ [BR-01], calendar view |
| `idx_appointments_patient` | `patient_id` | Normal | Xem lịch của một bệnh nhân |
| `idx_appointments_status` | `status` | Normal | Filter theo status |
| `idx_appointments_deleted_at` | `deleted_at` | Normal | Filter soft delete (nếu cần) |

**Foreign keys**:

| FK name | Column | Reference | On Delete | On Update |
|---------|--------|-----------|-----------|-----------|
| `fk_appointments_patients` | `patient_id` | `patients(id)` | RESTRICT | CASCADE |
| `fk_appointments_doctors` | `doctor_id` | `users(id)` | RESTRICT | CASCADE |
| `fk_appointments_depts` | `department_id` | `departments(id)` | RESTRICT | CASCADE |
| `fk_appointments_services` | `service_id` | `services(id)` | SET NULL | CASCADE |

**Unique constraints**: Không có.

**Check constraints** (ở app layer, không ép ở DB để tránh khó migrate):
- `end_time > start_time`
- `status` phải thuộc enum
- Không trùng khung giờ với bác sĩ khác (enforce bằng logic + transaction, KHÔNG dùng unique index do cần check overlap)

---

### 4.2 E-02: {{NextEntity}} (`{{next_table}}`)

<!-- Lặp lại cấu trúc như E-01. Nếu module chỉ có 1 entity, xóa section này. -->

---

## 5. Domain enums / constants

<!-- 
Nếu có enum dùng trong code C#, liệt kê ở đây. AI sẽ sinh class enum.
-->

### 5.1 `AppointmentStatus` (enum)
```
SCHEDULED = "SCHEDULED"
CONFIRMED = "CONFIRMED"
CANCELLED = "CANCELLED"
COMPLETED = "COMPLETED"
```

**Chuyển trạng thái hợp lệ** (enforce trong Domain):
- `SCHEDULED` → `CONFIRMED`, `CANCELLED`
- `CONFIRMED` → `COMPLETED`, `CANCELLED`
- `CANCELLED`, `COMPLETED` → (không chuyển đi đâu)

Ref: `01-feature-spec.md` section 5.

---

## 6. Migration

### 6.1 Migration name
`{YYYYMMDDHHmmss}_Create{{ModuleName}}Tables`

Ví dụ: `20260425103000_CreateAppointmentTables`

### 6.2 Migration steps
1. Tạo bảng `appointments`
2. Thêm các index như trên
3. Thêm FK constraints
4. {{Nếu có seed data, ghi ra đây}}

### 6.3 Rollback
- Drop FK constraints
- Drop indexes
- Drop table `appointments`

### 6.4 Data migration (nếu có)
<!-- 
Nếu module cần migrate dữ liệu từ HIS cũ, mô tả ở đây:
- Bảng nguồn trong HIS cũ
- Mapping column cũ → column mới
- Transform logic (nếu có)
- Script chạy 1 lần hay lặp lại
-->

{{Nếu không có, ghi: "N/A — module mới hoàn toàn, không migrate dữ liệu."}}

---

## 7. Seed data

<!-- 
Dữ liệu cần có sẵn ngay sau khi deploy (master data, default config...).
Không dùng cho dữ liệu test.
-->

**Permissions cần seed** (từ `01-feature-spec.md` section 8):

| Code | Description |
|------|-------------|
| `appointment:create` | Tạo lịch hẹn |
| `appointment:view` | Xem lịch hẹn (scope hạn chế) |
| `appointment:view_all` | Xem tất cả lịch hẹn |
| `appointment:update` | Cập nhật lịch hẹn |
| `appointment:cancel` | Hủy lịch hẹn |
| `appointment:delete` | Xóa (soft) lịch hẹn |

**Role bindings** (nếu cần set sẵn, nếu không thì để admin tự config):
- Role `RECEPTIONIST`: `appointment:create`, `appointment:view_all`, `appointment:update`, `appointment:cancel`
- Role `DOCTOR`: `appointment:view`
- Role `HEAD_OF_DEPARTMENT`: tất cả permission của DOCTOR + `appointment:view_all`

---

## 8. Relationships tổng quan

| From | To | Type | Cascade | Ghi chú |
|------|-----|------|---------|---------|
| `appointments` | `patients` | N:1 | RESTRICT | Không xóa bệnh nhân nếu còn lịch |
| `appointments` | `users` (doctor) | N:1 | RESTRICT | Không xóa bác sĩ nếu còn lịch |
| `appointments` | `departments` | N:1 | RESTRICT | — |
| `appointments` | `services` | N:1 (nullable) | SET NULL | Dịch vụ có thể được xóa sau |

---

## 9. Concurrency & Transaction

<!-- 
Có scenario nào cần transaction đặc biệt hoặc lock không?
Thường xuất hiện với: check trùng lịch, giữ chỗ, đếm số lượng có hạn...
-->

**Create Appointment** (cần transaction để tránh race condition trùng lịch):
```
BEGIN TRANSACTION
  1. Lock read: SELECT với FOR UPDATE các lịch của bác sĩ X có end_time > startTime AND start_time < endTime
  2. Nếu có overlap → throw APPOINTMENT_TIME_CONFLICT
  3. INSERT lịch mới
COMMIT
```

Các operation khác: transaction mặc định của EF Core (1 SaveChanges = 1 transaction).

---

## 10. Open Questions

- [ ] {{Ví dụ: Cần bảng `appointment_status_histories` để audit chuyển trạng thái không, hay chỉ cần log application?}}
- [ ] {{Ví dụ: `service_id` có nullable không? Lịch đặt trước có thể chưa chọn dịch vụ?}}

---

## 11. Checklist hoàn thành

- [ ] Mọi entity đã có ID (E-XX)
- [ ] Mọi column đều có type, null, default rõ ràng
- [ ] Đủ 2 audit columns cho mọi bảng nghiệp vụ
- [ ] Đủ index cho FK và query pattern thường gặp
- [ ] Đủ FK constraint với cascade rule rõ ràng
- [ ] Có migration name + steps + rollback
- [ ] Business Rule từ `01` đã được map vào constraint tương ứng
- [ ] Không còn Open Question
