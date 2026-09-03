# 04 — UI Specification: {{MODULE_NAME}}

> **Purpose**: Định nghĩa màn hình, component, flow, form validation, permission-based UI. Đầu vào để AI sinh code React.  
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: sẽ tham chiếu endpoint từ `03`, user story từ `01`.

<!-- 
HƯỚNG DẪN ĐIỀN FILE NÀY:
1. Đọc CONVENTIONS.md section 4 (React Conventions) trước khi điền.
2. Mỗi page có ID (PG-01, PG-02...).
3. Wireframe dùng ASCII art hoặc mô tả text. Không cần Figma chi tiết ở giai đoạn này — AI không đọc được ảnh.
4. Mọi API call phải map đến EP-XX trong `03-api-contract.md`.
5. Permission-based UI ghi RÕ: phần nào hiện khi có permission gì.
-->

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `{{MODULE_CODE}}` |
| Feature folder | `src/app/features/{{module-name}}/` |
| Route prefix | `/{{module-name}}` |
| Version | 1.0 |
| Status | Draft / In Review / Approved |
| Last updated | YYYY-MM-DD |

---

## 2. Danh sách page (route)

| ID | Route | Page component | Mục đích | Permission guard |
|----|-------|----------------|----------|------------------|
| PG-01 | `/appointments` | `AppointmentListPage` | Danh sách + filter | `appointment:view` |
| PG-02 | `/appointments/calendar` | `AppointmentCalendarPage` | Lịch dạng calendar | `appointment:view` |
| PG-03 | `/appointments/new` | `AppointmentFormPage` | Tạo mới | `appointment:create` |
| PG-04 | `/appointments/:id` | `AppointmentDetailPage` | Xem chi tiết | `appointment:view` |
| PG-05 | `/appointments/:id/edit` | `AppointmentFormPage` (reuse) | Cập nhật | `appointment:update` |

**Navigation entry** (menu): "Lịch hẹn" → mặc định vào PG-02 (calendar).

---

## 3. Chi tiết từng page

<!-- 
Mỗi page mô tả: layout, component con, state, API call, user interaction, permission UI.
Wireframe: ASCII art đủ thể hiện bố cục, không cần đẹp.
-->

---

### 3.1 PG-01: `AppointmentListPage`

**Route**: `/appointments`  
**User story**: US-05, US-06  
**Guard**: `PermissionGuard('appointment:view')`

**Layout** (wireframe):
```
┌─────────────────────────────────────────────────────────────────┐
│  Lịch hẹn                            [+ Tạo lịch hẹn]           │
├─────────────────────────────────────────────────────────────────┤
│ [Search] [Khoa ▼] [Bác sĩ ▼] [Status ▼] [From] [To] [Refresh]   │
├─────────────────────────────────────────────────────────────────┤
│ Bệnh nhân │ Bác sĩ │ Khoa │ Thời gian │ Trạng thái │ Actions   │
├───────────┼────────┼──────┼───────────┼────────────┼───────────┤
│ ...       │ ...    │ ...  │ ...       │ [Chip]     │ [View][…] │
│ ...       │ ...    │ ...  │ ...       │ [Chip]     │ [View][…] │
├─────────────────────────────────────────────────────────────────┤
│                      [◀ Prev] 1/7 [Next ▶]   20/page ▼          │
└─────────────────────────────────────────────────────────────────┘
```

**Component con**:
- `PageHeaderComponent` (shared) — title + action button
- `AppointmentFilterComponent` — form filter, emit event khi filter change
- `AppointmentTableComponent` — bảng hiển thị, sử dụng custom `<UiDataTable>`
- `UiPagination` — pagination

**State** (signals):
- `appointments: WritableSignal<AppointmentListItem[]>`
- `loading: WritableSignal<boolean>`
- `totalCount: WritableSignal<number>`
- `filter: WritableSignal<AppointmentFilter>` — bao gồm `search`, `departmentId`, `doctorId`, `status`, `from`, `to`
- `page`, `pageSize`, `sort`

**API call**:
- On init + on filter change + on page change: gọi **EP-03** với query params tương ứng.

**User interactions**:

| Action | Trigger | Kết quả |
|--------|---------|---------|
| Click "Tạo lịch hẹn" | Button | Navigate `/appointments/new`. **Chỉ hiện** nếu có `appointment:create`. |
| Change filter | Form control | Debounce 300ms, gọi lại EP-03, reset về page 1 |
| Click row "View" | Button | Navigate `/appointments/:id` |
| Click row "..." menu → Edit | MenuItem | Navigate `/appointments/:id/edit`. **Chỉ hiện** nếu có `appointment:update` |
| Click "..." menu → Cancel | MenuItem | Mở `ConfirmDialog` → gọi **EP-06** với `status=CANCELLED`. **Chỉ hiện** nếu có `appointment:cancel` và status đang là SCHEDULED/CONFIRMED |
| Click "..." menu → Delete | MenuItem | Mở `ConfirmDialog` → gọi **EP-07**. **Chỉ hiện** nếu có `appointment:delete` |

**Permission-based UI** (dùng `<HasPermission>`):
```tsx
<HasPermission code="appointment:create">
  <button className="btn btn-primary">
    Tạo lịch hẹn
  </button>
</HasPermission>
```

**Empty state**: Khi list rỗng, hiện icon + text "Chưa có lịch hẹn nào" + nút "Tạo lịch hẹn" (nếu có quyền).

**Error state**: Khi API fail, hiện banner lỗi + nút "Thử lại".

---

### 3.2 PG-02: `AppointmentCalendarPage`

**Route**: `/appointments/calendar`  
**User story**: US-07  
**Guard**: `PermissionGuard('appointment:view')`

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Lịch hẹn                                  [+ Tạo lịch hẹn]      │
├─────────────────────────────────────────────────────────────────┤
│ [◀ Hôm nay ▶]  Tháng 4/2026     [Day][Week][Month]  [Khoa ▼]    │
├─────────────────────────────────────────────────────────────────┤
│  Mon   Tue   Wed   Thu   Fri   Sat   Sun                        │
│ ┌────┬────┬────┬────┬────┬────┬────┐                           │
│ │    │    │  • │    │    │    │    │                           │
│ │    │ •• │  • │ •  │    │    │    │                           │
│ │ •  │    │ •• │    │    │    │    │                           │
│ └────┴────┴────┴────┴────┴────┴────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

**Thư viện**: khuyến nghị [FullCalendar React](https://fullcalendar.io/docs/react).  
{{→ Dev quyết định thư viện sau khi PoC. Ghi rõ ở đây để nhất quán.}}

**View modes**: Day / Week / Month. Mặc định: Week.

**State**:
- `events: Signal<AppointmentCalendarItem[]>`
- `viewMode: Signal<'day' | 'week' | 'month'>`
- `currentDate: Signal<Date>`
- `filter: Signal<{ doctorId?: number; departmentId?: number }>`

**API call**:
- Gọi **EP-04** mỗi khi `currentDate`, `viewMode`, hoặc `filter` thay đổi.
- Query `from`/`to` tính theo viewMode:
  - Day: from = 00:00, to = 23:59 của currentDate
  - Week: from = thứ 2, to = CN
  - Month: từ đầu tháng đến cuối tháng

**User interactions**:

| Action | Kết quả |
|--------|---------|
| Click ô event | Mở dialog hiển thị detail (hoặc navigate PG-04) |
| Click ô trống | Mở dialog tạo nhanh với startTime đã chọn sẵn (nếu có `appointment:create`) |
| Drag event sang ngày khác | Confirm dialog → gọi EP-05. **Chỉ hoạt động** nếu có `appointment:update` |
| Click "+ Tạo lịch hẹn" | Navigate `/appointments/new` |

**Color coding**:
- `SCHEDULED`: xanh dương
- `CONFIRMED`: xanh lá
- `CANCELLED`: xám (có gạch ngang)
- `COMPLETED`: tím

---

### 3.3 PG-03 / PG-05: `AppointmentFormPage` (Create + Edit reuse)

**Route**: `/appointments/new` hoặc `/appointments/:id/edit`  
**User story**: US-01, US-02  
**Guard**: `PermissionGuard('appointment:create')` hoặc `...':update')` tùy route

**Layout**:
```
┌─────────────────────────────────────────────┐
│  ← Quay lại       Tạo lịch hẹn              │
├─────────────────────────────────────────────┤
│  Bệnh nhân *    [ Autocomplete ▼        ]  │
│  Bác sĩ *       [ Dropdown ▼            ]  │
│  Khoa *         [ Dropdown ▼            ]  │
│  Dịch vụ        [ Dropdown ▼   (tùy chọn) ] │
│  Bắt đầu *      [ DateTime picker       ]  │
│  Kết thúc *     [ DateTime picker       ]  │
│  Ghi chú        [ Textarea              ]  │
│                                             │
│                           [Hủy] [Lưu]       │
└─────────────────────────────────────────────┘
```

**Form** (Reactive Form):

| Control | Type | Validator |
|---------|------|-----------|
| `patientId` | `number` | `required` |
| `doctorId` | `number` | `required` |
| `departmentId` | `number` | `required` |
| `serviceId` | `number` | optional |
| `startTime` | `Date` | `required`, `minDate(now)` |
| `endTime` | `Date` | `required`, custom `validateTimeRange` (end > start, 5min <= duration <= 4h) |
| `note` | `string` | `maxLength(2000)` |

**Cross-field validator**: `validateTimeRange` (ở group level).

**Component con**:
- `PatientAutocompleteComponent` — autocomplete search bệnh nhân (gọi API `/api/v1/patients?search=...`)
- `DoctorPickerComponent` — dropdown bác sĩ, filter theo department nếu đã chọn
- Custom DatePicker + TimePicker component cho datetime

**API call**:
- **Create mode** (PG-03): Click "Lưu" → gọi **EP-01**. Thành công → navigate về PG-02 + snackbar "Tạo thành công".
- **Edit mode** (PG-05): On init → gọi **EP-02** để load. Click "Lưu" → gọi **EP-05**.

**Error handling**:
- `APPOINTMENT_TIME_CONFLICT` (409) → hiện inline error dưới trường "Bắt đầu": "Bác sĩ đã có lịch khác trong khung giờ này."
- `VALIDATION_FAILED` (400) → gán error từ `details[]` vào từng field tương ứng.
- Error khác → snackbar lỗi generic.

**Dirty state**: Nếu user đã thay đổi form và click "Quay lại" hoặc navigate away → hiện confirm "Bạn có thay đổi chưa lưu. Tiếp tục thoát?"

---

### 3.4 PG-04: `AppointmentDetailPage`

**Route**: `/appointments/:id`  
**Guard**: `PermissionGuard('appointment:view')`

**Layout**:
```
┌─────────────────────────────────────────────┐
│ ← Lịch hẹn #1234                            │
│                                             │
│  Trạng thái: [Chip: CONFIRMED]              │
│  Bệnh nhân:  Nguyễn Văn A                   │
│  Bác sĩ:     BS. Trần Thị B                 │
│  Khoa:       Nội tổng quát                  │
│  Dịch vụ:    Khám tổng quát                 │
│  Thời gian:  25/04/2026 09:00 - 09:30       │
│  Ghi chú:    ...                            │
│                                             │
│  [Sửa] [Xác nhận] [Hủy] [Xóa]               │
└─────────────────────────────────────────────┘
```

**API call**: On init → gọi **EP-02**.

**Action buttons** (hiện có điều kiện):

| Button | Hiện khi |
|--------|----------|
| Sửa | `appointment:update` AND `status != COMPLETED` |
| Xác nhận (→ CONFIRMED) | `appointment:update` AND `status == SCHEDULED` |
| Đánh dấu đã khám (→ COMPLETED) | `appointment:update` AND `status == CONFIRMED` |
| Hủy | `appointment:cancel` AND `status IN (SCHEDULED, CONFIRMED)` |
| Xóa | `appointment:delete` |

---

## 4. User flows

### 4.1 Flow: Lễ tân đặt lịch cho khách hàng

```
1. Khách đến quầy
2. Lễ tân: PG-02 (calendar) → click ô trống
   → hoặc: click "+ Tạo lịch hẹn" → PG-03
3. PG-03: chọn Bệnh nhân → chọn Khoa → chọn Bác sĩ → chọn thời gian → Note
4. Click "Lưu"
5. (Success) → về PG-02, thấy event mới trên calendar, snackbar "Đã tạo"
6. (Trùng lịch) → inline error, không mất dữ liệu form
```

### 4.2 Flow: Hủy lịch

```
1. PG-01 (list) hoặc PG-04 (detail) → click "Hủy"
2. ConfirmDialog hiện: "Xác nhận hủy lịch hẹn?"
3. Optional: nhập lý do hủy (required theo EP-06)
4. Click "Xác nhận"
5. → EP-06 với status=CANCELLED, reason=...
6. Success → refresh list/detail, snackbar "Đã hủy"
```

---

## 5. Shared components cần tạo (nếu chưa có)

| Component | Mục đích | Dùng ở |
|-----------|----------|--------|
| `PatientAutocompleteComponent` | Search + chọn bệnh nhân | PG-03 |
| `DoctorPickerComponent` | Dropdown bác sĩ có filter khoa | PG-03 |
| `StatusChipComponent` | Hiển thị trạng thái với màu + label | PG-01, PG-04 |
| `ConfirmDialogComponent` | Dialog xác nhận chung | PG-01, PG-04 |
| `PageHeaderComponent` | Header trang chuẩn | Tất cả |

**Nếu đã có ở shared**: không tạo lại, chỉ import.

---

## 6. Routing config

File: `src/app/features/appointments/appointments.routes.ts`

```typescript
export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'calendar', pathMatch: 'full' },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/appointment-calendar/appointment-calendar.page')
          .then(m => m.AppointmentCalendarPage),
        canActivate: [permissionGuard(['appointment:view'])]
      },
      {
        path: 'list',
        loadComponent: () => import('./pages/appointment-list/appointment-list.page')
          .then(m => m.AppointmentListPage),
        canActivate: [permissionGuard(['appointment:view'])]
      },
      // ... các route khác
    ]
  }
];
```

**Lazy load** từ `app.routes.ts`:
```typescript
{
  path: 'appointments',
  loadChildren: () => import('./features/appointments/appointments.routes')
    .then(m => m.APPOINTMENT_ROUTES)
}
```

---

## 7. State management

**Không dùng Redux**. Mỗi page component tự quản lý state bằng `useState`/`useReducer`. Service chỉ chứa method gọi API, không giữ state.

**Exception**: Nếu cần share state giữa nhiều component (ví dụ "filter hiện tại" giữa list và calendar), dùng `AppointmentStateService` với signals, provide ở route level.

---

## 8. Responsive

| Breakpoint | Behavior |
|-----------|----------|
| Desktop (≥ 1024px) | Full layout như wireframe |
| Tablet (768 - 1023px) | Filter collapse thành dropdown, table có horizontal scroll |
| Mobile (< 768px) | Giai đoạn 1 **không hỗ trợ** — chỉ hiện banner "Vui lòng dùng máy tính" |

{{Nếu có yêu cầu mobile, update section này.}}

---

## 9. i18n (Tiếng Việt)

- Tất cả label, button, message dùng tiếng Việt (xem wireframe).
- Format date: `dd/MM/yyyy HH:mm` (giờ Việt Nam).
- Format datetime trong API: vẫn là ISO UTC (convert ở FE).
- Dùng `date-fns` hoặc `dayjs` với timezone `Asia/Ho_Chi_Minh`.

---

## 10. Loading & empty state convention

| Trạng thái | UI |
|-----------|-----|
| Loading | Skeleton cho table/calendar, spinner cho form |
| Empty | Icon + text + nút action (nếu có quyền) |
| Error | Banner lỗi + nút "Thử lại" |

---

## 11. Open Questions

- [ ] {{Ví dụ: Form tạo lịch có cần tự gợi ý khung giờ trống của bác sĩ không?}}
- [ ] {{Ví dụ: Drag-and-drop trên calendar: giữ luôn hay optional theo phase 2?}}

---

## 12. Checklist hoàn thành

- [ ] Mọi page có route, guard, wireframe, state, API mapping
- [ ] Mọi API call map được đến EP-XX trong `03-api-contract.md`
- [ ] Permission-based UI ghi rõ phần nào hiện với permission gì
- [ ] Form validation align với validation trong `03-api-contract.md`
- [ ] Shared component reuse được liệt kê, không lặp code
- [ ] Empty state + error state đã spec
- [ ] Không còn Open Question
