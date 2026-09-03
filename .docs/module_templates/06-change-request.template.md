# 06 — Change Request: {{TÊN NGẮN GỌN}}

> **Purpose**: Mô tả **một thay đổi cụ thể** cần thực hiện lên hệ thống đang chạy. Là đơn vị làm việc của dev — 1 CR = 1 Jira ticket = 1 session prompt Antigravity.
> **Owner**: Dev (người implement) — PM/BA có thể tạo draft.
> **Readers**: Dev review, QA, stakeholder.
> **Related**: `AGENTS.md`, `CONVENTIONS.md`, và các file `01`-`05` của module bị chạm.

<!--
HƯỚNG DẪN DÙNG FILE NÀY:

1. CHỌN TIER trước khi điền:
   - TIER S (Lite): typo, sửa validation, thêm 1 field không ảnh hưởng API signature, sửa UI text.
     → Chỉ cần điền section 1, 2, 3, 4 (ngắn), 7 (AC), 10 (DoD). Xoá các section khác.
   - TIER M (Standard): thêm endpoint, thêm trang UI, đổi business rule, đổi validation quan trọng.
     → Điền TẤT CẢ section.
   - TIER L (Heavy): đổi data model, breaking API change, thêm sub-feature lớn, cross-module nhiều hơn 2 module.
     → Điền TẤT CẢ section + bắt buộc section 8 (Migration) + section 9 (Rollback).
     → Nếu CR quá lớn, CÂN NHẮC CHIA THÀNH NHIỀU CR NHỎ.

2. Hotfix production (bug đang chặn user): BỎ QUA CR doc, fix + ghi CHANGELOG.
   Sau đó tạo CR retro trong vòng 3 ngày để audit.

3. Tên file: `docs/changes/{JIRA_KEY}-{slug-tieng-khong-dau}.md`
   Ví dụ: `docs/changes/HIS-234-them-ma-bhyt-cho-patient.md`

4. KHÔNG COPY spec từ 01-05 vào đây. Dùng reference [US-XX], [BR-XX], [E-XX], [EP-XX], [UI-XX].

5. CR chỉ mô tả DELTA (thay đổi gì so với hiện tại). Không viết lại nguyên cả spec.
-->

---

## 1. Meta

| Field | Value |
|-------|-------|
| Jira key | `HIS-{{XXX}}` (link: https://.../browse/HIS-{{XXX}}) |
| Title | {{Tên ngắn gọn, giống Jira}} |
| Tier | **S / M / L** (chọn 1) |
| Type | `feature` / `enhancement` / `bugfix` / `refactor` / `breaking` |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Status | `Draft` / `In Review` / `Approved` / `In Progress` / `Done` / `Cancelled` |
| Author | {{AUTHOR}} |
| Reviewers | {{Tên người review — tối thiểu 1 dev khác}} |
| Created | YYYY-MM-DD |
| Target sprint | {{Ví dụ: Sprint 2026-W18}} |
| Target version | {{Ví dụ: 1.3.0}} — version của toàn hệ thống sau khi merge CR này |

---

## 2. Context (BẮT BUỘC)

<!--
Tại sao cần thay đổi này? Trả lời 3 câu:
- Vấn đề hiện tại là gì (user pain, bug, technical debt, yêu cầu mới)?
- Thay đổi này giải quyết cho ai?
- Nếu KHÔNG làm thì sao?

KHÔNG viết giải pháp ở đây — giải pháp ở section 4, 5.
-->

{{2-5 câu mô tả bối cảnh. Không technical.}}

**Nguồn yêu cầu**: {{Feedback khách hàng / User testing / Bug report / Yêu cầu stakeholder / Technical debt}}
**Link tham chiếu** (nếu có): {{Jira comments, user feedback doc, bug ticket, ...}}

---

## 3. Scope (BẮT BUỘC)

### 3.1 Trong scope
- [ ] {{Liệt kê cụ thể những gì SẼ làm. Càng rõ càng tốt.}}
- [ ] {{Ví dụ: Thêm trường `insurance_code` vào entity Appointment}}
- [ ] {{Ví dụ: Hiển thị `insurance_code` trên trang chi tiết lịch hẹn}}

### 3.2 NGOÀI scope
- [ ] {{Liệt kê những gì có thể LIÊN QUAN nhưng KHÔNG làm trong CR này — để AI và reviewer không tự mở rộng.}}
- [ ] {{Ví dụ: KHÔNG tích hợp API BHYT bên ngoài — sẽ làm ở CR khác}}
- [ ] {{Ví dụ: KHÔNG validate định dạng mã BHYT (chỉ lưu string trong giai đoạn này)}}

---

## 4. Impact Analysis (BẮT BUỘC)

<!--
Đây là SECTION QUAN TRỌNG NHẤT của CR. Nó nói cho bạn, reviewer, và AI biết
CHÍNH XÁC file nào cần sửa.

Điền ma trận dưới. Với mỗi ô "✅", mô tả NGẮN sẽ sửa gì ở cột "Delta".
-->

### 4.1 Ma trận module × tài liệu (Impact Matrix)

| Module | 01-feature-spec | 02-data-model | 03-api-contract | 04-ui-spec | 05-test-plan | Code BE | Code FE | DB Migration |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `appointment` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `patient` | — | — | — | ✅ | ✅ | — | ✅ | — |
| `billing` | ✅ | — | ✅ | — | ✅ | ✅ | — | — |

### 4.2 Delta chi tiết

<!--
Cho mỗi ô ✅ ở trên, ghi 1 dòng delta. Format:
  - [module/file] WHAT + WHERE (reference ID nếu có)
-->

**Module: `appointment`**
- `01-feature-spec.md` — Bump minor: thêm BR-05 "Mã BHYT là optional, nếu có phải ≤ 20 ký tự"
- `02-data-model.md` — Bump minor: thêm column `insurance_code VARCHAR(20) NULL` vào bảng `appointments` [E-01]
- `03-api-contract.md` — Bump minor: thêm field `insuranceCode` vào `CreateAppointmentDto`, `UpdateAppointmentDto`, `AppointmentDto` [EP-01, EP-05, EP-02]
- `04-ui-spec.md` — Bump minor: thêm input "Mã BHYT" vào form tạo/sửa lịch; thêm cột hiển thị trên detail page
- `05-test-plan.md` — Bump minor: thêm test case T-24 (create với insurance_code), T-25 (insurance_code > 20 ký tự → 400)
- Code BE — thêm field vào entity, DTO, validator, mapping
- Code FE — thêm form control, hiển thị
- DB Migration — file mới `{YYYYMMDDHHmmss}_AddInsuranceCodeToAppointments.cs`

**Module: `patient`**
- `04-ui-spec.md` — Bump patch: cập nhật wording UI-07 (trang chi tiết patient) để chỉ ra mã BHYT đã có sẵn
- `05-test-plan.md` — Bump patch: thêm manual test check mã BHYT hiển thị đúng
- Code FE — thêm read-only field hiển thị

**Module: `billing`**
- ... (tương tự)

### 4.3 Version bump dự kiến

| File | Version cũ | Version mới | Loại |
|------|-----------|-------------|------|
| `docs/modules/appointment/01-feature-spec.md` | 1.2 | 1.3 | Minor |
| `docs/modules/appointment/02-data-model.md` | 1.1 | 1.2 | Minor |
| `docs/modules/appointment/03-api-contract.md` | 1.1 | 1.2 | Minor |
| `docs/modules/appointment/04-ui-spec.md` | 1.0 | 1.1 | Minor |
| `docs/modules/appointment/05-test-plan.md` | 1.0 | 1.1 | Minor |
| `docs/modules/patient/04-ui-spec.md` | 1.4 | 1.4.1 | Patch |

---

## 5. Spec Delta (BẮT BUỘC cho Tier M/L, optional cho Tier S)

<!--
Mô tả CHI TIẾT sẽ thay đổi gì. Dùng format BEFORE / AFTER khi có ích.

Nếu thay đổi đơn giản (ví dụ thêm field mới), chỉ cần ghi AFTER là đủ.
Nếu thay đổi logic/rule đã có, PHẢI ghi cả BEFORE để reviewer so sánh.
-->

### 5.1 Data model — `appointments` table

**AFTER** (thêm column):

| Column | Type | Null | Default | Mô tả |
|--------|------|------|---------|-------|
| `insurance_code` | `VARCHAR(20)` | YES | NULL | Mã bảo hiểm y tế (BHYT). Optional. |

Không thêm index (query không filter theo field này ở phase 1).

### 5.2 API contract

**[EP-01] POST /api/v1/appointments** — thêm field trong `CreateAppointmentDto`:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `insuranceCode` | `string?` | No | max 20 ký tự, trim trắng, nullable |

**[EP-02], [EP-05]** — tương tự, DTO response thêm `insuranceCode`.

### 5.3 Business rules mới

- **BR-05**: Mã BHYT là field optional. Nếu có giá trị, phải ≤ 20 ký tự. Không validate format (chờ CR sau khi có spec BHYT chuẩn).

### 5.4 UI changes

**[UI-03] Form tạo lịch hẹn**:
- Thêm input "Mã BHYT" ngay sau "Ghi chú", placeholder "Nhập mã BHYT nếu có"
- Width: 240px
- Không bắt buộc

**[UI-04] Trang chi tiết lịch hẹn**:
- Thêm dòng "Mã BHYT" trong section "Thông tin khác", hiện "—" nếu null

---

## 6. Breaking Changes (Tier L bắt buộc, tier M ghi "None" nếu không có)

<!--
BREAKING = gây lỗi cho client/consumer hiện tại:
- Xoá field/endpoint
- Đổi type, đổi semantics
- Đổi response structure
- Đổi error code
- Đổi required/optional

Nếu có breaking → BẮT BUỘC có migration plan (section 8) và thông báo cho consumer.
-->

{{Ghi "None" nếu không có. Nếu có, liệt kê từng cái và affect ai.}}

---

## 7. Acceptance Criteria (BẮT BUỘC)

<!--
Format Given-When-Then, giống US-XX trong 01-feature-spec.md.
Tối thiểu: 1 happy path + 2 error path.
Mỗi AC phải TESTABLE.
-->

### AC-1: Tạo lịch hẹn kèm mã BHYT — happy path
- **Given** tôi có quyền `appointment:create`
- **When** tôi submit form tạo lịch với `insuranceCode = "HS401234567"`
- **Then** API trả về `201`, response có field `insuranceCode = "HS401234567"`
- **And** DB record có `insurance_code = "HS401234567"`

### AC-2: Tạo lịch hẹn không điền mã BHYT
- **Given** tôi có quyền `appointment:create`
- **When** tôi submit form không điền `insuranceCode` (hoặc gửi null/empty)
- **Then** API trả về `201`, DB record có `insurance_code = NULL`

### AC-3: Mã BHYT > 20 ký tự
- **When** gửi `insuranceCode = "ABCDEFGHIJ1234567890X"` (21 ký tự)
- **Then** API trả về `400`, `error.code = VALIDATION_FAILED`, `details[].field = "insuranceCode"`

### AC-4: Hiển thị trên detail page
- **Given** lịch hẹn có `insurance_code = "HS401234567"`
- **When** mở trang chi tiết
- **Then** thấy dòng "Mã BHYT: HS401234567"

### AC-5: Detail page với lịch không có mã BHYT
- **Given** lịch hẹn có `insurance_code = null`
- **When** mở trang chi tiết
- **Then** thấy dòng "Mã BHYT: —"

---

## 8. Migration Plan (Tier L bắt buộc; M chỉ cần nếu có DB migration)

### 8.1 DB migration

**Migration name**: `{YYYYMMDDHHmmss}_AddInsuranceCodeToAppointments`

**Steps**:
1. ALTER TABLE `appointments` ADD COLUMN `insurance_code VARCHAR(20) NULL` AFTER `note`.
2. Backfill: không cần (field nullable, data cũ giữ NULL).

**Downtime**: Không (ALTER TABLE ADD COLUMN nullable trên MySQL 8 InnoDB là online operation với bảng < 1M rows. Nếu lớn hơn, cân nhắc gh-ost hoặc schedule off-hour).

**Test migration**:
- [ ] Chạy trên DB staging có data
- [ ] Chạy rollback sau đó chạy lại → thành công

### 8.2 Data migration

{{"None" hoặc mô tả ETL từ data cũ.}}

### 8.3 Consumer migration (nếu breaking)

{{Ai đang gọi API cũ, cần thông báo khi nào, format thông báo, deprecation period, ...}}

---

## 9. Rollback Plan (Tier L bắt buộc)

<!--
Nếu CR fail sau khi deploy production, làm gì để revert?
-->

**Code**: `git revert` PR. Redeploy.
**DB**: Chạy rollback migration — DROP COLUMN `insurance_code`. **CẢNH BÁO**: dữ liệu mã BHYT đã nhập sẽ mất. Chấp nhận được ở phase này vì field optional.

**Feature flag** (nếu cần): Không dùng (CR nhỏ, rủi ro thấp).

---

## 10. Test Cases mới cần thêm vào `05-test-plan.md`

<!--
Liệt kê test case MỚI cần thêm. Format như section 3, 4 của 05-test-plan template.
Sau khi CR merge, copy các test case này vào file 05 tương ứng.
-->

### Unit tests (BE)

| Test ID | Handler | Scenario | Expected |
|---------|---------|----------|----------|
| T-24 | `CreateAppointmentHandler` | `insuranceCode = "HS401234567"` | Entity có insurance_code đúng |
| T-25 | `CreateAppointmentValidator` | `insuranceCode.Length > 20` | Error trên field |
| T-26 | `CreateAppointmentHandler` | `insuranceCode = null` | Entity có insurance_code = null |

### Integration tests (BE)

| Test ID | Endpoint | Scenario | Expected |
|---------|----------|----------|----------|
| T-27 | POST /appointments | Body có `insuranceCode` | 201, DB có value |
| T-28 | POST /appointments | Body `insuranceCode` 21 ký tự | 400, VALIDATION_FAILED |
| T-29 | GET /appointments/{id} | Lịch có insurance_code | Response có field |

### FE tests

| Test ID | Scope | Scenario |
|---------|-------|----------|
| T-30 | `AppointmentService.create` | Gửi đúng body có `insuranceCode` |
| T-31 | Form component | Input mã BHYT > 20 ký tự → hiện error |

### Manual E2E
- [ ] Vào form tạo lịch → thấy input mã BHYT
- [ ] Tạo lịch kèm mã BHYT → detail page hiện đúng
- [ ] Tạo lịch không điền → detail page hiện "—"
- [ ] Sửa lịch, thay đổi mã BHYT → save → reload → hiện giá trị mới

---

## 11. Open Questions

<!--
Câu hỏi CHƯA có đáp án. Phải giải quyết HẾT trước khi status → Approved.
-->

- [ ] {{Ví dụ: Mã BHYT có cần validate theo format VN (10 số) không? → quyết định: không validate phase này.}}
- [ ] {{Ví dụ: Có cần unique không? → quyết định: không (1 người có thể có nhiều lịch hẹn cùng mã).}}

---

## 12. Definition of Done (BẮT BUỘC — checklist ép kỷ luật)

**Code**:
- [ ] Code đã implement đủ scope section 3.1
- [ ] Code KHÔNG chạm vào cái gì ở section 3.2
- [ ] Không có `TODO` / `FIXME` / `console.log` rác
- [ ] Follow CONVENTIONS.md (naming, folder, pattern)

**Tests**:
- [ ] Tất cả test mới ở section 10 đã viết và pass
- [ ] Không break test cũ
- [ ] Unit coverage của module bị chạm không giảm

**Docs (SYNC BẮT BUỘC — thiếu là không merge)**:
- [ ] File 01-05 của các module bị chạm đã được update theo section 4.2
- [ ] Version đã bump theo section 4.3
- [ ] `docs/modules/{module}/CHANGELOG.md` đã thêm entry mới cho version này
- [ ] Nếu có breaking change, đã note ở CHANGELOG kèm migration note
- [ ] Open Questions (section 11) đã giải quyết hết

**Review & Deploy**:
- [ ] PR đã có ít nhất 1 approve từ dev khác
- [ ] Đã test trên staging
- [ ] Nếu có DB migration: đã test rollback
- [ ] Đã link Jira: PR title + commit message có `HIS-{{XXX}}`

---

## 13. Post-deploy Verification

<!--
Sau khi deploy production, kiểm tra gì để biết CR đã thành công.
-->

- [ ] Smoke test AC-1, AC-4 trên production
- [ ] Monitor log 24h: không có error liên quan `insurance_code` / `VALIDATION_FAILED`
- [ ] {{Nếu có metric cần track: ghi ở đây}}