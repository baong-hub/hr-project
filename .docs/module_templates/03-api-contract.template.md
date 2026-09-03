# 03 — API Contract: {{MODULE_NAME}}

> **Purpose**: Định nghĩa toàn bộ API của module. Đầu vào để AI sinh Command/Query/Handler/Controller/DTO/Validator.  
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md` sẽ tham chiếu các endpoint ở đây.

<!-- 
HƯỚNG DẪN ĐIỀN FILE NÀY:
1. Đọc CONVENTIONS.md section 2 (API Conventions) trước khi điền.
2. Mỗi endpoint có ID (EP-01, EP-02...) để file 04, 05 tham chiếu.
3. Tham chiếu entity từ 02 bằng [E-01], [E-02].
4. Tham chiếu business rule từ 01 bằng [BR-01], [BR-02].
5. Error code phải được liệt kê TẤT CẢ trong section 5 để đảm bảo nhất quán.
6. DTO không được có audit columns (created_at, created_by...) trong request. Response có thể có.
-->

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `{{MODULE_CODE}}` |
| API base path | `/api/v1/{{resource-name}}` |
| Version | 1.0 |
| Status | Draft / In Review / Approved |
| Author | {{AUTHOR}} |
| Last updated | YYYY-MM-DD |

---

## 2. Danh sách endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | POST | `/api/v1/appointments` | Tạo lịch hẹn | `appointment:create` | US-01 |
| EP-02 | GET | `/api/v1/appointments/{id}` | Xem chi tiết 1 lịch | `appointment:view` | US-05 |
| EP-03 | GET | `/api/v1/appointments` | List + filter + paginate | `appointment:view` / `appointment:view_all` | US-05, US-06 |
| EP-04 | GET | `/api/v1/appointments/calendar` | Lấy dữ liệu cho calendar view | `appointment:view` / `appointment:view_all` | US-07 |
| EP-05 | PUT | `/api/v1/appointments/{id}` | Cập nhật lịch hẹn | `appointment:update` | US-02 |
| EP-06 | PUT | `/api/v1/appointments/{id}/status` | Đổi trạng thái | `appointment:update` / `appointment:cancel` | US-03 |
| EP-07 | DELETE | `/api/v1/appointments/{id}` | Xóa (soft) lịch | `appointment:delete` | US-04 |

---

## 3. Chi tiết endpoint

<!-- 
Mỗi endpoint ghi theo format dưới.
Response chuẩn luôn là ApiResponse<T> theo CONVENTIONS.md 2.3 — không lặp lại structure đó, chỉ ghi T.
-->

---

### 3.1 EP-01: Tạo lịch hẹn

**Method & Path**: `POST /api/v1/appointments`  
**Permission**: `appointment:create`  
**Tham chiếu**: US-01, [BR-01], [BR-02], [E-01]

**Request body** — `CreateAppointmentDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `patientId` | `long` | Yes | `> 0`, phải tồn tại trong `patients` | ID bệnh nhân |
| `doctorId` | `long` | Yes | `> 0`, phải tồn tại trong `users`, user đó phải là Doctor | ID bác sĩ |
| `departmentId` | `long` | Yes | `> 0`, phải tồn tại | ID khoa |
| `serviceId` | `long?` | No | nếu có thì `> 0` và phải tồn tại | ID dịch vụ |
| `startTime` | `DateTime` | Yes | ISO 8601 UTC, `>= now` [BR-02] | Giờ bắt đầu |
| `endTime` | `DateTime` | Yes | `> startTime`, cách startTime `>= 5 phút`, `<= 4h` | Giờ kết thúc |
| `note` | `string?` | No | max 2000 ký tự | Ghi chú |

**Business validation** (ở Handler, không ở Validator):
- [BR-01] Không trùng lịch với `doctorId` — overlap check (xem `02-data-model.md` section 9)

**Response success** — `201 Created`  
Body: `ApiResponse<AppointmentDto>` (xem section 4.1)

**Response errors**:

| Status | Error code | Khi nào |
|--------|-----------|---------|
| 400 | `VALIDATION_FAILED` | Input không hợp lệ (xem field validation) |
| 404 | `PATIENT_NOT_FOUND` | patientId không tồn tại |
| 404 | `DOCTOR_NOT_FOUND` | doctorId không tồn tại hoặc không phải Doctor |
| 409 | `APPOINTMENT_TIME_CONFLICT` | Trùng khung giờ bác sĩ [BR-01] |
| 401 | `AUTH_REQUIRED` | Chưa đăng nhập |
| 403 | `PERMISSION_DENIED` | Không có quyền |

**Side effects**:
- Tạo record trong `appointments` với `status = SCHEDULED`, `created_by = currentUser.id`

**Example request**:
```json
POST /api/v1/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": 42,
  "doctorId": 17,
  "departmentId": 3,
  "serviceId": 8,
  "startTime": "2026-04-25T09:00:00Z",
  "endTime":   "2026-04-25T09:30:00Z",
  "note": "Bệnh nhân yêu cầu khám sáng sớm"
}
```

**Example response** (201):
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "patientId": 42,
    "doctorId": 17,
    "departmentId": 3,
    "serviceId": 8,
    "startTime": "2026-04-25T09:00:00Z",
    "endTime":   "2026-04-25T09:30:00Z",
    "status": "SCHEDULED",
    "note": "Bệnh nhân yêu cầu khám sáng sớm",
    "createdAt": "2026-04-20T11:30:00Z"
  },
  "error": null
}
```

---

### 3.2 EP-02: Xem chi tiết lịch hẹn

**Method & Path**: `GET /api/v1/appointments/{id}`  
**Permission**: `appointment:view` (với scope check) hoặc `appointment:view_all`

**Path param**: `id` — `long`, `> 0`

**Scope logic**:
- Nếu user có `appointment:view_all` → xem được bất kỳ
- Nếu user chỉ có `appointment:view` → chỉ xem được lịch có `created_by = currentUser.id` HOẶC `doctor_id = currentUser.id`

**Response success**: `200 OK`  
Body: `ApiResponse<AppointmentDetailDto>` (xem section 4.2)

**Response errors**:
| Status | Error code | Khi nào |
|--------|-----------|---------|
| 404 | `APPOINTMENT_NOT_FOUND` | Không có hoặc đã bị soft-delete |
| 403 | `PERMISSION_DENIED` | Có `:view` nhưng ngoài scope |

---

### 3.3 EP-03: List lịch hẹn (filter + paginate)

**Method & Path**: `GET /api/v1/appointments`  
**Permission**: `appointment:view` / `appointment:view_all`

**Query params**:

| Param | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `page` | `int` | No | `1` | Trang |
| `pageSize` | `int` | No | `20` | Max 100 |
| `sort` | `string` | No | `-startTime` | Ví dụ: `-startTime,patientName` |
| `from` | `DateTime?` | No | — | Filter `startTime >= from` |
| `to` | `DateTime?` | No | — | Filter `startTime <= to` |
| `filter[doctorId]` | `long?` | No | — | Filter theo bác sĩ |
| `filter[patientId]` | `long?` | No | — | Filter theo bệnh nhân |
| `filter[departmentId]` | `long?` | No | — | Filter theo khoa |
| `filter[status]` | `string?` | No | — | SCHEDULED, CONFIRMED, ... |
| `search` | `string?` | No | — | Tìm trong `note` và tên bệnh nhân |

**Scope logic**: như EP-02.

**Response success**: `200 OK`  
Body: `ApiResponse<AppointmentListItemDto[]>` với `meta` (pagination).

---

### 3.4 EP-04: Calendar view

**Method & Path**: `GET /api/v1/appointments/calendar`  
**Permission**: `appointment:view` / `appointment:view_all`

**Query params**:

| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `from` | `DateTime` | Yes | Bắt đầu khung thời gian |
| `to` | `DateTime` | Yes | Kết thúc khung thời gian, `to - from <= 31 days` |
| `doctorId` | `long?` | No | Lọc theo 1 bác sĩ (dùng cho view bác sĩ) |
| `departmentId` | `long?` | No | Lọc theo khoa |

**Response**: `200 OK`  
Body: `ApiResponse<AppointmentCalendarItemDto[]>` — **không paginate**, trả về toàn bộ trong khoảng.

**Lưu ý**: DTO ở đây **mỏng hơn** AppointmentDto (chỉ các trường cần vẽ calendar). Xem section 4.4.

---

### 3.5 EP-05: Cập nhật lịch hẹn

**Method & Path**: `PUT /api/v1/appointments/{id}`  
**Permission**: `appointment:update`  
**Tham chiếu**: US-02, [BR-01], [BR-04]

**Path param**: `id`

**Request body** — `UpdateAppointmentDto`: giống `CreateAppointmentDto` nhưng tất cả field optional? KHÔNG — PUT là replace nên vẫn required.

**Business validation**:
- [BR-04] Lịch ở trạng thái `COMPLETED` **không được** sửa → trả `APPOINTMENT_INVALID_STATUS_FOR_EDIT`
- [BR-01] Check overlap như EP-01 (loại trừ chính lịch đang sửa)

**Response errors** (bổ sung so với EP-01):
| Status | Error code | Khi nào |
|--------|-----------|---------|
| 404 | `APPOINTMENT_NOT_FOUND` | ID không tồn tại |
| 409 | `APPOINTMENT_INVALID_STATUS_FOR_EDIT` | [BR-04] |

---

### 3.6 EP-06: Đổi trạng thái

**Method & Path**: `PUT /api/v1/appointments/{id}/status`  
**Permission**:
- Chuyển sang `CONFIRMED`, `COMPLETED` → `appointment:update`
- Chuyển sang `CANCELLED` → `appointment:cancel`

**Request body** — `ChangeAppointmentStatusDto`:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | `string` | Yes | thuộc enum `AppointmentStatus` |
| `reason` | `string?` | No | required nếu status = `CANCELLED`, max 500 ký tự |

**Business validation**:
- State transition phải hợp lệ theo `01-feature-spec.md` section 5 → `APPOINTMENT_INVALID_STATUS_TRANSITION`

**Response success**: `200 OK`, body `ApiResponse<AppointmentDto>`

---

### 3.7 EP-07: Xóa (soft) lịch hẹn

**Method & Path**: `DELETE /api/v1/appointments/{id}`  
**Permission**: `appointment:delete`  
**Tham chiếu**: US-04

**Response success**: `204 No Content`

**Response errors**:
| Status | Error code |
|--------|-----------|
| 404 | `APPOINTMENT_NOT_FOUND` |

**Side effects**: set `deleted_at = now()`, `deleted_by = currentUser.id`. **Không** xóa cứng.

---

## 4. DTOs

<!-- 
Liệt kê TẤT CẢ DTO dùng trong API. 
Tên C#: PascalCase. Tên JSON: camelCase.
-->

### 4.1 `AppointmentDto` (response chuẩn)

| Field | Type | Nullable | Mô tả |
|-------|------|----------|-------|
| `id` | `long` | No | |
| `patientId` | `long` | No | |
| `patientName` | `string` | No | Denormalize cho UI đỡ gọi thêm |
| `doctorId` | `long` | No | |
| `doctorName` | `string` | No | |
| `departmentId` | `long` | No | |
| `departmentName` | `string` | No | |
| `serviceId` | `long?` | Yes | |
| `serviceName` | `string?` | Yes | |
| `startTime` | `DateTime` | No | UTC |
| `endTime` | `DateTime` | No | UTC |
| `status` | `string` | No | enum value |
| `note` | `string?` | Yes | |
| `createdAt` | `DateTime` | No | |
| `createdByName` | `string` | No | Tên người tạo |

### 4.2 `AppointmentDetailDto`
Kế thừa `AppointmentDto` + bổ sung:
| Field | Type | Mô tả |
|-------|------|-------|
| `statusHistory` | `AppointmentStatusHistoryItemDto[]` | Nếu có bảng E-02 |
| `updatedAt` | `DateTime` | |
| `updatedByName` | `string` | |

### 4.3 `AppointmentListItemDto` (dùng cho list — gọn hơn)
| Field | Type |
|-------|------|
| `id`, `patientName`, `doctorName`, `departmentName`, `startTime`, `endTime`, `status` | ... |

### 4.4 `AppointmentCalendarItemDto` (dùng cho calendar — siêu gọn)
| Field | Type |
|-------|------|
| `id` | `long` |
| `title` | `string` (= patientName) |
| `doctorId` | `long` |
| `doctorName` | `string` |
| `startTime` | `DateTime` |
| `endTime` | `DateTime` |
| `status` | `string` |
| `color` | `string?` (ví dụ: gán màu theo bác sĩ hoặc theo status) |

### 4.5 `CreateAppointmentDto` — xem section 3.1
### 4.6 `UpdateAppointmentDto` — xem section 3.5
### 4.7 `ChangeAppointmentStatusDto` — xem section 3.6

---

## 5. Error code catalog

<!-- 
Liệt kê TẤT CẢ error code của module. Mỗi code dùng 1 lần xuyên suốt các file.
Format: UPPER_SNAKE_CASE, tiền tố là module (APPOINTMENT_, PATIENT_, ...).
-->

| Code | HTTP | User message (VI) | Dev note |
|------|------|-------------------|----------|
| `APPOINTMENT_NOT_FOUND` | 404 | Không tìm thấy lịch hẹn. | |
| `APPOINTMENT_TIME_CONFLICT` | 409 | Khung giờ này đã có lịch hẹn khác với bác sĩ. | [BR-01] |
| `APPOINTMENT_INVALID_STATUS_TRANSITION` | 409 | Không thể chuyển lịch hẹn sang trạng thái này. | Kèm `details.currentStatus`, `details.targetStatus` |
| `APPOINTMENT_INVALID_STATUS_FOR_EDIT` | 409 | Lịch hẹn đã hoàn tất, không thể sửa. | [BR-04] |
| `APPOINTMENT_START_TIME_IN_PAST` | 400 | Thời gian bắt đầu phải ở tương lai. | [BR-02] |
| `PATIENT_NOT_FOUND` | 404 | Không tìm thấy bệnh nhân. | |
| `DOCTOR_NOT_FOUND` | 404 | Không tìm thấy bác sĩ. | Có thể user tồn tại nhưng không phải Doctor |
| `VALIDATION_FAILED` | 400 | Dữ liệu không hợp lệ. | `details[]` chứa field + message |
| `PERMISSION_DENIED` | 403 | Bạn không có quyền thực hiện hành động này. | Global |
| `AUTH_REQUIRED` | 401 | Vui lòng đăng nhập lại. | Global |

---

## 6. Permission matrix

| Endpoint | Guest | User không perm | `appointment:view` | `appointment:view_all` | `appointment:create` | `appointment:update` | `appointment:cancel` | `appointment:delete` |
|----------|-------|-----------------|---------------------|-------------------------|----------------------|----------------------|----------------------|----------------------|
| EP-01 Create | 401 | 403 | 403 | 403 | ✅ | — | — | — |
| EP-02 Detail | 401 | 403 | ✅ (scope) | ✅ | — | — | — | — |
| EP-03 List | 401 | 403 | ✅ (scope) | ✅ | — | — | — | — |
| EP-04 Calendar | 401 | 403 | ✅ (scope) | ✅ | — | — | — | — |
| EP-05 Update | 401 | 403 | — | — | — | ✅ | — | — |
| EP-06 Status → Confirmed/Completed | 401 | 403 | — | — | — | ✅ | — | — |
| EP-06 Status → Cancelled | 401 | 403 | — | — | — | — | ✅ | — |
| EP-07 Delete | 401 | 403 | — | — | — | — | — | ✅ |

---

## 7. Idempotency & Caching

- **Idempotent**: GET (EP-02, EP-03, EP-04), PUT (EP-05), DELETE (EP-07)
- **Non-idempotent**: POST (EP-01)
- **Cache**: Không cache ở API layer. Calendar view có thể cache ở FE tối đa 30 giây.

---

## 8. Rate limit

{{Chưa áp dụng giai đoạn 1. Ghi "N/A" hoặc spec giới hạn nếu cần.}}

---

## 9. Open Questions

- [ ] {{Ví dụ: EP-04 Calendar có cần stream/pagination không nếu khoa có nhiều lịch?}}
- [ ] {{Ví dụ: PUT status có nên thành các endpoint riêng (`/confirm`, `/cancel`) để rõ ràng hơn?}}

---

## 10. Checklist hoàn thành

- [ ] Mọi endpoint có ID, method, path, permission, reference US
- [ ] Mọi DTO đã định nghĩa đầy đủ field, type, nullable
- [ ] Validation rule ghi rõ cho từng field (ở Validator) và business rule (ở Handler)
- [ ] Error code catalog đầy đủ, nhất quán với Handler
- [ ] Permission matrix đã fill đủ
- [ ] Các endpoint tuân thủ CONVENTIONS.md (REST, plural, kebab-case path)
- [ ] Response format đồng nhất `ApiResponse<T>`
- [ ] Không còn Open Question
