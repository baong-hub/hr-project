# 05 — Test Plan: {{MODULE_NAME}}

> **Purpose**: Định nghĩa test case cho module. AI sẽ sinh unit test + integration test từ file này.  
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md`, `03-api-contract.md`, `04-ui-spec.md` đã Approved.

<!-- 
HƯỚNG DẪN ĐIỀN FILE NÀY:
1. Đọc CONVENTIONS.md section 8 (Testing Conventions) trước khi điền.
2. Format test case: Given-When-Then, nhất quán từ 01.
3. Tham chiếu: [US-XX] cho user story, [BR-XX] cho rule, [EP-XX] cho endpoint, [E-XX] cho entity.
4. ƯU TIÊN 3 loại test:
   - Unit: logic trong Handler
   - Integration: full API endpoint (từ HTTP đến DB)
   - E2E (manual hoặc automation): flow nghiệp vụ xuyên page
5. Giai đoạn 1, unit + integration là bắt buộc. E2E có thể manual.
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

## 2. Test scope & strategy

| Test type | Scope | Framework | Mandatory |
|-----------|-------|-----------|-----------|
| Unit (BE) | Command/Query Handler, Domain logic, Validator | xUnit + FluentAssertions + NSubstitute | ✅ |
| Integration (BE) | Full endpoint: HTTP request → DB | xUnit + WebApplicationFactory + Testcontainers (MySQL) | ✅ |
| Unit (FE) | Service, Hook, Context, Util | Vitest + React Testing Library | ✅ (chỉ Service + Auth guard giai đoạn 1) |
| Component (FE) | Component render, user interaction | Vitest + React Testing Library | 🟡 (khuyến khích) |
| E2E | Flow xuyên page | Manual theo checklist section 6 | ✅ (manual) |

**Coverage target**:
- Unit test BE (Handlers): **≥ 80%** branch coverage
- Integration test BE: **mọi endpoint chính** có ít nhất 1 happy path + 2 error path
- FE: không đặt target coverage giai đoạn 1

---

## 3. Unit Tests (Backend)

<!-- 
1 handler = 1 test class. Test file nằm cùng cấu trúc folder.
VD: HIS.UnitTests/Appointments/Commands/CreateAppointment/CreateAppointmentHandlerTests.cs
-->

### 3.1 `CreateAppointmentHandler`

**File**: `HIS.UnitTests/Appointments/Commands/CreateAppointment/CreateAppointmentHandlerTests.cs`

**Mocks**: `IAppointmentRepository`, `ICurrentUserService`, `IDateTimeProvider`

| Test method | Scenario | Expected |
|-------------|----------|----------|
| `Handle_WhenValidInput_ShouldCreateAppointment` | Input hợp lệ, không trùng lịch | Repo.AddAsync được gọi 1 lần với entity đúng, trả về `AppointmentDto` |
| `Handle_WhenDoctorHasConflict_ShouldThrowConflictException` | Repo.HasConflictAsync trả về true | Throw `ConflictException` với code `APPOINTMENT_TIME_CONFLICT` [BR-01] |
| `Handle_ShouldSetStatusToScheduled` | Input hợp lệ | Entity được tạo có `Status = SCHEDULED` |
| `Handle_ShouldSetAuditFields` | Input hợp lệ, currentUser.Id = 10 | Entity có `CreatedBy = 10`, `CreatedAt = mocked utc` |
| `Handle_WhenPatientIdNotExists_ShouldThrowNotFound` | Repo check patient → null | Throw `NotFoundException` với code `PATIENT_NOT_FOUND` |

<!-- Lặp lại cho các handler khác: UpdateAppointmentHandler, DeleteAppointmentHandler, GetAppointmentByIdHandler, ... -->

### 3.2 `CreateAppointmentValidator`

| Test | Input | Expected |
|------|-------|----------|
| `Validate_WhenPatientIdZero_ShouldHaveError` | `patientId = 0` | Error trên `PatientId` |
| `Validate_WhenStartTimeAfterEndTime_ShouldHaveError` | start > end | Error `StartTime phải nhỏ hơn EndTime` |
| `Validate_WhenNoteTooLong_ShouldHaveError` | note.Length > 2000 | Error trên `Note` |
| `Validate_WhenAllValid_ShouldPass` | All valid | Không có error |

### 3.3 Domain logic tests (nếu có)

<!-- 
Nếu Entity có method như `Confirm()`, `Cancel()`, test state transition ở đây.
-->

**`Appointment.ChangeStatus`**

| Test | From → To | Expected |
|------|-----------|----------|
| `ChangeStatus_FromScheduledToConfirmed_ShouldSucceed` | SCHEDULED → CONFIRMED | Status = CONFIRMED |
| `ChangeStatus_FromCompletedToAny_ShouldThrow` | COMPLETED → * | Throw `InvalidStatusTransitionException` [BR-04] |
| `ChangeStatus_FromScheduledToCompleted_ShouldThrow` | SCHEDULED → COMPLETED (phải qua CONFIRMED) | Throw `InvalidStatusTransitionException` |

---

## 4. Integration Tests (Backend)

**Setup**:
- Dùng `WebApplicationFactory<Program>` với DB Testcontainers MySQL 8 (giả lập).
- Mỗi test reset DB qua migration + seed data tối thiểu (1 patient, 1 doctor, 1 department).
- Auth: override middleware để tự inject fake `CurrentUser` với permission list tuỳ test.

### 4.1 `POST /api/v1/appointments` — [EP-01]

| Test case | Setup | Request | Expected |
|-----------|-------|---------|----------|
| Tạo thành công | User có `appointment:create`, patient + doctor tồn tại | Valid body | `201`, body `data.id > 0`, status `SCHEDULED`, DB có record |
| Trùng lịch | Đã có lịch của doctor 17 lúc 09:00-09:30 | Body với doctor 17, 09:15-09:45 | `409`, `error.code = APPOINTMENT_TIME_CONFLICT` [BR-01] |
| Thiếu quyền | User không có permission | Valid body | `403`, `error.code = PERMISSION_DENIED` |
| Chưa đăng nhập | No Authorization header | Valid body | `401` |
| Validation fail | `startTime > endTime` | Invalid body | `400`, `error.code = VALIDATION_FAILED`, `details[]` chứa field |
| Patient không tồn tại | patientId = 99999 | | `404`, `error.code = PATIENT_NOT_FOUND` |
| StartTime trong quá khứ | startTime = yesterday | | `400`, `error.code = APPOINTMENT_START_TIME_IN_PAST` [BR-02] |

### 4.2 `GET /api/v1/appointments/{id}` — [EP-02]

| Test case | Setup | Expected |
|-----------|-------|----------|
| Xem được lịch của mình | User có `:view`, lịch có `created_by = user.id` | `200` |
| Xem lịch khác → 403 | User chỉ có `:view`, lịch của user khác | `403` |
| Xem mọi lịch với `:view_all` | User có `:view_all` | `200` cho bất kỳ lịch nào |
| Lịch đã soft-delete | `deleted_at != null` | `404` |
| ID không tồn tại | id = 99999 | `404` |

### 4.3 `GET /api/v1/appointments` (list) — [EP-03]

| Test case | Query | Expected |
|-----------|-------|----------|
| Default pagination | none | `page=1, pageSize=20`, records đúng thứ tự mặc định |
| Filter by doctorId | `?filter[doctorId]=17` | Chỉ trả lịch của doctor 17 |
| Filter by date range | `?from=2026-04-25&to=2026-04-26` | Chỉ trả lịch trong khoảng |
| Sort desc startTime | `?sort=-startTime` | Sắp xếp giảm dần |
| PageSize > 100 | `?pageSize=500` | Cap về 100 |
| Scope với `:view` | User có `:view` only | Chỉ trả lịch `created_by` hoặc `doctor_id = user.id` |

### 4.4 `GET /api/v1/appointments/calendar` — [EP-04]

| Test case | Query | Expected |
|-----------|-------|----------|
| Lấy calendar 1 tuần | `?from=2026-04-20&to=2026-04-26` | Trả về DTO gọn (`AppointmentCalendarItemDto`), không phân trang |
| Khoảng > 31 ngày | `?from=2026-01-01&to=2026-06-01` | `400`, validation error |
| Thiếu from/to | `?from=2026-04-20` | `400` |

### 4.5 `PUT /api/v1/appointments/{id}` — [EP-05]

| Test case | Expected |
|-----------|----------|
| Update lịch ở SCHEDULED — thành công | `200`, DB reflect |
| Update lịch ở COMPLETED | `409`, `APPOINTMENT_INVALID_STATUS_FOR_EDIT` [BR-04] |
| Update gây trùng lịch với lịch khác | `409`, `APPOINTMENT_TIME_CONFLICT` |
| Update gây trùng với chính nó (cùng id) | `200` — phải exclude chính mình khi check overlap |

### 4.6 `PUT /api/v1/appointments/{id}/status` — [EP-06]

| Test case | From → To | Expected |
|-----------|-----------|----------|
| SCHEDULED → CONFIRMED | có `:update` | `200` |
| SCHEDULED → CANCELLED | có `:cancel`, reason != null | `200` |
| SCHEDULED → CANCELLED không có reason | `:cancel` | `400`, validation `reason required` |
| CANCELLED → SCHEDULED | bất kỳ quyền | `409`, `APPOINTMENT_INVALID_STATUS_TRANSITION` |
| SCHEDULED → COMPLETED (skip CONFIRMED) | `:update` | `409`, `APPOINTMENT_INVALID_STATUS_TRANSITION` |
| Đổi sang CANCELLED nhưng chỉ có `:update` | | `403` |

### 4.7 `DELETE /api/v1/appointments/{id}` — [EP-07]

| Test case | Expected |
|-----------|----------|
| Delete thành công | `204`, DB có `deleted_at`, `deleted_by` |
| Delete lịch đã delete | `404` |
| Delete không có quyền | `403` |

---

## 5. Frontend Tests

### 5.1 `AppointmentService` (bắt buộc)

| Method | Test case |
|--------|-----------|
| `getAll()` | Gọi đúng URL + query params; parse đúng `ApiResponse` |
| `getById(id)` | Gọi đúng URL; xử lý error 404 |
| `create(dto)` | POST đúng body; bubble up error |
| `update(id, dto)` | PUT đúng URL + body |
| `changeStatus(id, status, reason)` | PUT đúng URL |
| `delete(id)` | DELETE đúng URL |

Dùng `vi.mock` hoặc MSW để mock HTTP request.

### 5.2 `permissionGuard` (bắt buộc)

| Test case | Expected |
|-----------|----------|
| User có permission yêu cầu | `canActivate → true` |
| User không có | `canActivate → false`, navigate đến `/forbidden` |
| User chưa đăng nhập | Navigate đến `/login` |

### 5.3 `HasPermission` component

| Test case | Expected |
|-----------|----------|
| User có permission | Element được render |
| User không có | Element không được render (fallback hoặc null) |

### 5.4 Component tests (optional giai đoạn 1)

{{Có thể skip nếu timeline gấp, bổ sung sau.}}

---

## 6. End-to-End (Manual) Test Checklist

Dùng checklist này trước khi merge PR hoặc release. **Tester tự vận hành** trên môi trường dev.

### 6.1 Happy path — Tạo lịch và hoàn tất khám [US-01, US-02]

- [ ] Đăng nhập với tài khoản lễ tân
- [ ] Vào "Lịch hẹn" → calendar view hiện
- [ ] Click "+ Tạo lịch hẹn"
- [ ] Chọn bệnh nhân, bác sĩ, khoa, giờ hợp lệ → Lưu
- [ ] Snackbar hiện "Tạo thành công"
- [ ] Lịch hẹn mới hiển thị trên calendar, màu xanh dương (SCHEDULED)
- [ ] Click vào lịch → detail page hiện
- [ ] Click "Xác nhận" → status chuyển CONFIRMED, màu xanh lá
- [ ] Đăng nhập bằng tài khoản bác sĩ đó → thấy lịch của mình
- [ ] Bác sĩ click "Đánh dấu đã khám" → status COMPLETED, màu tím

### 6.2 Error case — Trùng lịch [BR-01]

- [ ] Có lịch sẵn của bác sĩ X, 09:00-09:30, ngày mai
- [ ] Tạo lịch mới, bác sĩ X, 09:15-09:45, ngày mai
- [ ] Click Lưu → form KHÔNG reset, error hiện inline: "Bác sĩ đã có lịch khác trong khung giờ này."

### 6.3 Permission [US-01, US-03]

- [ ] Đăng nhập tài khoản chỉ có `:view` (ví dụ bác sĩ thường)
- [ ] Không thấy nút "+ Tạo lịch hẹn"
- [ ] Không thấy menu "Sửa", "Xóa" trên table
- [ ] Truy cập trực tiếp URL `/appointments/new` → redirect về `/forbidden`

### 6.4 Calendar view [US-07]

- [ ] Đổi qua Day / Week / Month → data reload
- [ ] Đổi ngày qua nút ◀ ▶ → data reload đúng khoảng thời gian
- [ ] Filter theo khoa → chỉ hiện lịch của khoa
- [ ] Click ô event → mở detail

### 6.5 Hủy lịch [US-03]

- [ ] Chọn lịch SCHEDULED, click "..." → "Hủy"
- [ ] Dialog yêu cầu nhập lý do → để trống → nút Xác nhận disable
- [ ] Nhập lý do → Xác nhận
- [ ] Lịch chuyển status CANCELLED, có gạch ngang

### 6.6 Cross-browser (smoke)

- [ ] Chrome mới nhất
- [ ] Edge mới nhất
- [ ] Firefox mới nhất (nếu yêu cầu)

### 6.7 Performance smoke

- [ ] Calendar view với ~500 lịch hẹn trong tháng → load < 2s
- [ ] List view paginate 20 records → load < 1s

---

## 7. Test Data Seed (cho integration test)

<!-- Data tối thiểu cần seed để chạy được test. -->

| Entity | Record |
|--------|--------|
| `users` | 1 admin, 1 lễ tân, 1 bác sĩ A, 1 bác sĩ B, 1 trưởng khoa |
| `patients` | 3 bệnh nhân |
| `departments` | 2 khoa |
| `services` | 3 dịch vụ |
| Permissions | Toàn bộ `appointment:*` đã seed |
| Roles | `RECEPTIONIST`, `DOCTOR`, `HEAD_OF_DEPARTMENT` với permission mapping như `02-data-model.md` section 7 |

---

## 8. Acceptance Criteria tổng (Definition of Done)

Module coi là **Done** khi:

- [ ] Tất cả unit test pass, coverage ≥ 80%
- [ ] Tất cả integration test trong section 4 pass
- [ ] Manual E2E checklist section 6 pass 100%
- [ ] Code đã được ít nhất 1 dev khác review và approve PR
- [ ] Convention trong `CONVENTIONS.md` được tuân thủ (checklist section 9)
- [ ] Swagger docs tự động gen và đọc được
- [ ] Migration chạy được trên DB trống và DB đã có data
- [ ] Rollback migration được test thủ công
- [ ] Không có console.error trong FE khi thao tác happy path
- [ ] Tài liệu 01-04 đã Approved, không còn Open Question

---

## 9. Open Questions

- [ ] {{Ví dụ: Có cần setup CI/CD chạy integration test tự động phase 1 không, hay chỉ local?}}
- [ ] {{Ví dụ: E2E có cần automation (Playwright) phase 1 không?}}

---

## 10. Checklist hoàn thành

- [ ] Mọi endpoint trong `03` có ít nhất 1 happy + 2 error integration test
- [ ] Mọi Handler trong `03` có unit test
- [ ] Mọi Business Rule trong `01` có ít nhất 1 test verify
- [ ] Mọi state transition có test
- [ ] Manual E2E checklist cover hết user story chính
- [ ] Definition of Done rõ ràng, đo được
