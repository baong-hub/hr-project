# Module Spec Templates — Hướng dẫn sử dụng

> Bộ 5 template `.md` để đặc tả một module của HIS. Được thiết kế để **prompt cho Antigravity** sinh code nhất quán, dev review nhanh.

---

## 1. Bộ tài liệu chuẩn của 1 module

Mỗi module HIS sẽ có **5 file** trong thư mục riêng:

```
docs/modules/appointment/
├── 01-feature-spec.md       ← Yêu cầu nghiệp vụ
├── 02-data-model.md         ← Schema DB + Entity
├── 03-api-contract.md       ← Endpoint + DTO + Error
├── 04-ui-spec.md            ← Frontend (React)
└── 05-test-plan.md          ← Unit + Integration + E2E
```

Kèm 2 file **toàn cục** (không ở trong module):

```
docs/
├── ARCHITECTURE.md          ← Kiến trúc tổng thể
└── CONVENTIONS.md           ← Quy ước code
```

---

## 2. Quy trình viết 1 module

| Bước | File | Ai làm |
|------|------|--------|
| 1 | `01-feature-spec.md` | BA/PO |
| 2 | Dev review `01`, phản hồi | Dev | 
| 3 | `02-data-model.md` | Dev | 
| 4 | `03-api-contract.md` | Dev | 
| 5 | `04-ui-spec.md` | Dev + BA | 
| 6 | `05-test-plan.md` | Dev | 
| 7 | Prompt Antigravity theo thứ tự → review code | Cả team |

---

## 3. Thứ tự feed vào Antigravity

**Rất quan trọng** — sai thứ tự = code sai:

```
[Context cố định — Bắt đầu khỏi tạo 1 module mới]
Prompt 1 (Planning)
  ARCHITECTURE.md
  CONVENTIONS.md
  + 01-feature-spec.md
  → AI sinh: Kiểm tra, hỏi đáp, phản hồi, quyết định, chốt plan 

[Context theo module — prompt sinh code cho từng lớp]
Prompt 2 (Database):
  + 02-data-model.md
  → AI sinh: Entity classes, EF configurations, Migration

Prompt 3 (API):
  + 02-data-model.md  (cần lại cho context entity)
  + 03-api-contract.md
  → AI sinh: Commands, Queries, Handlers, Validators, DTOs, Controller

Prompt 4 (Frontend):
  + 03-api-contract.md  (FE cần biết API shape)
  + 04-ui-spec.md
  + thêm các ảnh mockups
  → AI sinh: Services, Components, Pages, Routes

Prompt 5 (Manual test + chỉnh sửa):
  + 02 + 03 + 05-test-plan.md
  → AI sinh: Unit tests, Integration tests
```

**Không** feed cả 5 file cùng lúc — context quá dài, AI sẽ miss detail.

---

## 4. Nguyên tắc vàng khi dùng template

### 4.1 Ký hiệu viết tắt
| Ký hiệu | Ý nghĩa | File xuất hiện | Ai sửa | Đánh số cho cái gì |
|---------|---------|----------------|--------|--------------------|
| **[US-XX]** | User Story | 01-feature-spec.md | BA/PO | Mỗi user story (ví dụ US-01: Tạo lịch hẹn)|
| **[BR-XX]** | Business Rule | 01-feature-spec.md | BA/PO | Mỗi quy tắc nghiệp vụ (ví dụ BR-01: Bác sĩ không được có 2 lịch trùng giờ)|
| **[E-XX]** | Entity | 02-data-model.md | Dev | Mỗi entity/bảng DB (ví dụ E-01: Appointment)|
| **[EP-XX]** | Endpoint | 03-api-contract.md | Dev | Mỗi endpoint API (ví dụ EP-01: Create Appointment)|
| **[UI-XX]** | UI Component | 04-ui-spec.md | Dev | Mỗi component UI (ví dụ UI-01: Appointment List Component)|
| **[T-XX]** | Test Case | 05-test-plan.md | Dev | Mỗi test case (ví dụ T-01: Test create appointment success)|
- XX chỉ là số thứ tự

### 4.2 Không bỏ qua checklist cuối mỗi file
Mỗi template có checklist ở section cuối. **Không chuyển file sang Approved** nếu còn unchecked.

### 4.3 Cross-reference phải chính xác
- `02` reference `[BR-XX]` từ `01`
- `03` reference `[E-XX]` từ `02`, `[US-XX]` từ `01`
- `04` reference `[EP-XX]` từ `03`, `[US-XX]` từ `01`
- `05` reference cả 4 file trên

AI dùng reference này để liên kết context. Sai reference → AI sinh code lạc.

### 4.4 Open Questions KHÔNG được bỏ trống qua loa
Nếu có thắc mắc → ghi vào Open Questions. **Không tự giả định**.  
AI đọc Open Questions = biết khoảng đang mù mờ → sẽ hỏi lại hoặc note rõ phần nó đoán.

### 4.5 Không copy-paste giữa các file
Nếu thông tin đã có ở file này → file khác chỉ **reference**, không copy.  
Lý do: khi sửa, dễ quên sync → data model cũ mâu thuẫn với spec mới.

### 4.6 Update version khi có thay đổi lớn
Version bump:
- Major: thay đổi breaking (xóa entity, đổi path API)
- Minor: thêm feature, thêm field
- Patch: sửa typo, làm rõ

---

## 5. Prompt mẫu cho Antigravity

### 5.1 Sinh migration + entity (Prompt 1)
```
Bạn là senior .NET developer. Đọc các file đính kèm:
- ARCHITECTURE.md — kiến trúc hệ thống
- CONVENTIONS.md — quy ước code (bắt buộc tuân thủ)
- 02-data-model.md — spec data model module Appointment

Sinh code theo đúng CONVENTIONS.md:
1. Entity class cho mỗi entity trong section 3 của data-model
2. IEntityTypeConfiguration cho mỗi entity (EF Core Fluent API)
3. EF Core migration file đúng tên quy ước ở section 6
4. Domain enum nếu có (section 5)
5. BaseEntity class nếu chưa có, có 6 audit columns

Ràng buộc:
- Đặt file đúng folder theo CONVENTIONS.md
- Dùng naming PascalCase cho class, snake_case cho DB column
- KHÔNG tự bịa field không có trong spec
- Nếu spec mâu thuẫn với CONVENTIONS.md, ưu tiên CONVENTIONS.md và ghi note

Trả về:
- Mỗi file trong code block riêng, có comment đường dẫn đầy đủ
- Cuối cùng: tóm tắt các quyết định và note
```

### 5.2 Sinh API (Prompt 2)
```
Bạn là senior .NET developer. Context:
- ARCHITECTURE.md, CONVENTIONS.md (bắt buộc tuân thủ)
- 02-data-model.md (entity đã code xong ở prompt trước)
- 03-api-contract.md — spec API module Appointment

Sinh code:
1. DTO cho mỗi item trong section 4 của api-contract (kèm AppointmentDto, CreateAppointmentDto, ...)
2. Mỗi endpoint section 3 → 1 Command hoặc Query + Handler + Validator (nếu Command)
3. Controller AppointmentsController mỏng, chỉ forward Mediator
4. Custom Exception class nếu cần (ConflictException, ...)
5. Permission attribute setup nếu chưa có

Ràng buộc:
- Follow đúng pattern Command/Handler/Validator trong CONVENTIONS.md section 3.4
- Mọi endpoint có [RequirePermission(...)]
- Response bọc ApiResponse<T> đúng format section 2.3 của CONVENTIONS
- Error throw custom exception → middleware convert (KHÔNG return BadRequest trực tiếp trong controller)

Trả về: như prompt 1
```

### 5.3 Sinh Frontend (Prompt 3)
```
Bạn là senior React developer. Context:
- CONVENTIONS.md section 4 (React conventions)
- 03-api-contract.md — API shape
- 04-ui-spec.md — spec UI module Appointment

Sinh code theo thứ tự:
1. Model interface (appointment.model.ts)
2. Service (appointmentService.ts) — gọi đủ endpoint trong 03
3. Routes config (routes.tsx) — lazy loading với React.lazy
4. Từng page component trong section 3 của ui-spec

Ràng buộc:
- Functional Components, TypeScript strict
- Controlled Form / React Hook Form
- Dùng <HasPermission> component / useHasPermission hook cho permission-based UI
- Gọi API qua service, không fetch trực tiếp trong component
- Đủ loading + error + empty state theo section 10 của ui-spec

Trả về: như prompt 1
```

### 5.4 Sinh Test (Prompt 4)
```
Bạn là senior QA engineer + developer. Context:
- CONVENTIONS.md section 8 (Testing conventions)
- 02-data-model.md, 03-api-contract.md
- 05-test-plan.md — spec test

Sinh:
1. Unit test cho từng Handler trong section 3 của test-plan
2. Integration test cho từng endpoint trong section 4
3. FE service test trong section 5

Ràng buộc:
- Naming: MethodName_Scenario_ExpectedResult
- Cấu trúc Arrange-Act-Assert có comment phân tách
- Dùng NSubstitute cho mock (BE), HttpTestingController (FE)
- Integration test dùng WebApplicationFactory + Testcontainers MySQL

Trả về: như prompt 1
```

---

## 6. Common mistakes (tránh)

| ❌ Sai | ✅ Đúng |
|--------|---------|
| BA viết 01 với chi tiết technical (bảng DB, endpoint) | 01 chỉ có ngôn ngữ nghiệp vụ |
| 02 copy field list vào 03 | 03 chỉ reference `[E-XX]`, không copy |
| Feed cả 5 file + ARCH + CONV cùng lúc | Chia 4 prompt như section 5 |
| Skip checklist cuối file | Bắt buộc tick đủ mới Approve |
| AI sinh code xong → merge thẳng | Dev review line-by-line, đặc biệt là business logic |
| Đổi CONVENTIONS giữa chừng | Chốt xong mới chạy. Đổi sau phải update toàn bộ module đã code |

---

## 7. Khi nào mở rộng thêm file?

Thêm `06-xxx.md` nếu module cần:

- `06-integration.md` — tích hợp hệ thống ngoài (LIS, PACS, BHXH...)
- `06-data-migration.md` — ETL phức tạp từ HIS cũ sang
- `06-reports.md` — báo cáo phức tạp với query đặc thù

**Không** thêm file nếu chỉ thêm vài note — bổ sung vào file hiện có là đủ.
