# Change Request Flow — Hướng dẫn sử dụng

> Quy trình thay đổi (sửa/mở rộng) hệ thống SAU KHI module đã được release. Song hành với `00-README-templates.md` (quy trình tạo module mới).

---

## 1. Khi nào dùng CR, khi nào dùng flow 01-05?

| Loại công việc | Dùng gì |
|----------------|---------|
| Tạo module mới từ đầu | Flow `01` → `05` (xem `00-README-templates.md`) |
| Sửa đổi module đã có | **CR** (file này) |
| Fix bug đang chặn production | Hotfix — fix trước, CR retro sau |
| Refactor không đổi behavior | CR Tier S |
| Thêm field / thêm endpoint | CR Tier M |
| Đổi data model / breaking API | CR Tier L |

---

## 2. Flow closed-loop trong 1 sprint

```
 ┌──────────────────────────────────────────────────────────┐
 │                      JIRA BACKLOG                        │
 │  (bug, feature request, technical debt, user feedback)   │
 └─────────────────────────────┬────────────────────────────┘
                               │
                               ▼
            ┌──────────────────────────────────┐
            │  Sprint Planning (2 tuần/sprint) │
            │  - Chọn ticket                    │
            │  - Chốt Tier (S/M/L)              │
            │  - Assign dev                     │
            └──────────────────┬───────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  IMPLEMENTATION PER CR (mỗi ticket Jira = 1 CR)             │
 │                                                             │
 │  1. Dev tạo file CR (docs/changes/HIS-XXX-slug.md)          │
 │     → Điền section 1-7, assign reviewer                     │
 │                                                             │
 │  2. Reviewer check: scope, impact analysis, AC              │
 │     → Status: Draft → In Review → Approved                  │
 │                                                             │
 │  3. Dev UPDATE 01-05 của module bị chạm TRƯỚC khi code      │
 │     → Bump version theo section 4.3 của CR                  │
 │                                                             │
 │  4. Dev prompt Antigravity ở "Change Mode"                  │
 │     (xem section 4 của file này)                            │
 │                                                             │
 │  5. Review code AI sinh → chỉnh tay nếu cần                 │
 │                                                             │
 │  6. Viết test mới theo section 10 của CR, pass hết          │
 │                                                             │
 │  7. Tạo PR:                                                 │
 │     - Title: "HIS-XXX: <slug>"                              │
 │     - Body: link CR, checklist DoD                          │
 │                                                             │
 │  8. PR review → merge                                       │
 │                                                             │
 │  9. Update CHANGELOG.md của module                          │
 │     → CR Status: Done                                       │
 └────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
           ┌──────────────────────────────────┐
           │  Release cuối sprint             │
           │  - Gom [Unreleased] → version mới│
           │  - Tag git, deploy               │
           └──────────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Post-deploy verification     │
              │  (section 13 của CR)          │
              └───────────────────────────────┘
                              │
                              ▼
                  Bug / feedback → CR mới → quay lại Jira Backlog
```

---

## 3. Ai làm gì

| Vai trò | Trách nhiệm trong CR flow |
|---------|---------------------------|
| **PM/BA** | Tạo Jira ticket với đủ context; có thể tạo CR Draft cho Tier M/L; duyệt section 2-3-7 của CR |
| **Dev implement** | Tạo CR file; điền Impact Analysis; update 01-05; prompt Antigravity; viết code + test; tạo PR; update CHANGELOG |
| **Dev reviewer** | Review CR trước khi approve; review PR; đối chiếu code với spec delta trong CR |
| **QA** | Verify AC (section 7); chạy manual E2E (section 10); verify post-deploy (section 13) |
| **Tech Lead** | Approve Tier L CR; quyết định khi có conflict spec; duyệt breaking change |

---

## 4. Prompt Antigravity ở "Change Mode"

**KHÁC BIỆT QUAN TRỌNG** so với "New Module Mode":
- New Module Mode: feed 01-05 + AI tạo code MỚI.
- Change Mode: feed CR + 01-05 HIỆN TẠI (đã update theo CR) + AI SỬA code hiện có.

### 4.1 Context feed (giống nhau cho mọi Tier)

```
[File nền tảng — luôn có]
- AGENTS.md
- CONVENTIONS.md
- STYLE_GUIDELINE.md (nếu chạm FE)

[File module — chỉ feed module bị chạm trong section 4.1 của CR]
- docs/modules/{module}/01-feature-spec.md  (PHIÊN BẢN ĐÃ UPDATE theo CR)
- docs/modules/{module}/02-data-model.md    (ĐÃ UPDATE)
- docs/modules/{module}/03-api-contract.md  (ĐÃ UPDATE)
- docs/modules/{module}/04-ui-spec.md       (ĐÃ UPDATE, nếu chạm FE)
- docs/modules/{module}/05-test-plan.md     (ĐÃ UPDATE)

[File CR — quan trọng nhất]
- docs/changes/HIS-XXX-slug.md
```

### 4.2 Prompt skeleton cho Tier S (Lite)

```
Context:
- AGENTS.md, CONVENTIONS.md
- docs/modules/appointment/02-data-model.md (đã update)
- docs/modules/appointment/03-api-contract.md (đã update)
- docs/changes/HIS-234-them-ma-bhyt-cho-patient.md

Task: Implement CR HIS-234 theo đúng section 4.2 (Delta) và section 5 (Spec Delta).

Ràng buộc:
- Chỉ sửa file được liệt kê trong Impact Matrix (section 4.1 của CR).
- KHÔNG sửa logic không được ghi trong Delta.
- Nếu thấy spec trong 01-05 mâu thuẫn với CR → DỪNG và báo, KHÔNG tự đoán.
- Follow naming + folder theo CONVENTIONS.md.

Deliverables:
1. Code diff cho từng file (ghi rõ đường dẫn)
2. Migration file (nếu có)
3. Tóm tắt các quyết định nếu có ambiguity
```

### 4.3 Prompt skeleton cho Tier M/L

Dùng **3 prompt nhỏ** thay vì 1 prompt lớn, để AI không miss detail:

**Prompt M-1: Data + API Layer**
```
Context: AGENTS + CONVENTIONS + 02-data-model + 03-api-contract (đã update) + CR file
Task: Implement thay đổi BE theo CR HIS-XXX:
1. Entity/DTO updates
2. Handler/Validator updates  
3. Migration mới (nếu có)
4. Controller updates
Ràng buộc: như M-0 skeleton trên.
```

**Prompt M-2: Frontend Layer**
```
Context: AGENTS + CONVENTIONS + STYLE_GUIDELINE + 03-api-contract + 04-ui-spec (đã update) + CR file
Task: Implement thay đổi FE theo CR HIS-XXX:
1. Service updates
2. Model/interface updates
3. Component updates theo UI-XX trong section 5 của CR
Ràng buộc: như skeleton.
```

**Prompt M-3: Tests**
```
Context: AGENTS + CONVENTIONS + 05-test-plan (đã update) + CR file
Task: Viết các test case mới trong section 10 của CR HIS-XXX.
Bao gồm: unit test BE, integration test BE, FE service test.
Follow section 8 CONVENTIONS.md cho naming test.
```

### 4.4 Điểm mấu chốt để AI không phá code cũ

Luôn bỏ vào prompt câu sau:

> **Nếu phát hiện spec trong 01-05 chưa khớp với CR, hoặc code hiện có mâu thuẫn với spec mới, DỪNG LẠI và báo rõ. KHÔNG tự sửa ngoài scope CR. KHÔNG tự "cleanup" code cũ nếu không được yêu cầu.**

Đây là câu ép AI không "helpful quá mức" — một trong những nguyên nhân hàng đầu phá code ở brownfield.

---

## 5. Phân loại Tier — hướng dẫn quyết định

**Dùng bảng này ở sprint planning để chốt Tier:**

| Đặc điểm | Tier S | Tier M | Tier L |
|----------|:---:|:---:|:---:|
| Số file 01-05 bị chạm | 1-2 | 2-4 | 4-5 hoặc nhiều module |
| Có DB migration không? | Không | Có thể | Có |
| Có breaking change? | Không | Không | Có thể |
| Có đổi business rule hiện có? | Không | Có thể | Có |
| Effort estimate | ≤ 1 ngày | 1-3 ngày | > 3 ngày |
| Số CR/tháng điển hình | 60-70% | 25-35% | 5-10% |

**Nguyên tắc:** khi phân vân giữa 2 Tier, chọn Tier cao hơn. Tier thấp hơn bỏ qua detail sẽ gây vấn đề sau.

**Cờ đỏ — PHẢI là Tier L:**
- Xoá field, xoá endpoint, đổi type
- Đổi semantics của field/endpoint đã deploy
- Chạm > 2 module
- Data migration phức tạp

---

## 6. Git convention cho CR

### 6.1 Branch naming
```
feat/HIS-234-them-ma-bhyt
fix/HIS-211-overlap-check-cancelled  
refactor/HIS-198-status-endpoint
```

### 6.2 Commit message
```
HIS-234: add insurance_code field to appointments

- Add column to appointments table
- Update DTOs (Create/Update/Detail)
- Add validation (max 20 chars)
- Update UI form + detail page

Refs: docs/changes/HIS-234-them-ma-bhyt-cho-patient.md
```

### 6.3 PR title
```
HIS-234: Thêm mã BHYT cho lịch hẹn
```

### 6.4 PR body template

```markdown
## CR
docs/changes/HIS-234-them-ma-bhyt-cho-patient.md

## Jira
https://.../browse/HIS-234

## Summary
{{1-2 câu tóm tắt}}

## DoD Checklist
- [x] Code implement đủ scope
- [x] Tests mới viết và pass
- [x] Docs 01-05 đã update + bump version
- [x] CHANGELOG.md entry đã thêm
- [x] Manual E2E đã test staging
- [ ] (Optional) Migration rollback đã test
```

---

## 7. Hotfix — khi nào skip CR?

**Điều kiện:**
- Bug đang chặn user production (P0)
- Fix nhỏ (< 50 LOC)
- Không đổi schema DB, không đổi API signature

**Flow:**
1. Tạo branch `hotfix/HIS-XXX-slug`
2. Fix + test
3. PR fast-track (1 reviewer đủ)
4. Merge + deploy ngay
5. **Trong vòng 3 ngày**: tạo CR retro, ghi CHANGELOG, update docs nếu cần.

Không có retro → hotfix đó thành technical debt, docs lệch dần.

---

## 8. Cross-module CR

Nếu 1 CR chạm > 1 module:
- **File CR**: 1 file duy nhất tại `docs/changes/HIS-XXX-slug.md`
- **Impact matrix**: liệt kê tất cả module ở section 4.1
- **CHANGELOG**: mỗi module bị chạm **tự ghi entry riêng** vào CHANGELOG.md của module đó, tất cả cùng reference tới CR HIS-XXX
- **PR**: 1 PR hay nhiều PR?
  - Tier S/M cross 2 module: 1 PR
  - Tier L cross 3+ module: cân nhắc chia, nhưng vẫn 1 CR, nhiều PR con cùng link về CR

---

## 9. Live document — quy tắc giữ 01-05 không thối

Bạn đã chọn live document (sửa tại chỗ). Để giữ docs luôn khớp với code:

1. **Rule vàng**: update docs TRƯỚC code, trong cùng PR.
2. **Rule sắt**: DoD ép — thiếu update docs, không merge. Không linh hoạt.
3. **Rule review**: reviewer PHẢI đọc cả docs diff, không chỉ code diff.
4. **Git history** = audit trail. Không cần file `02-data-model-v2.md` riêng.
5. Mỗi 1 quý review 1 lần: đọc toàn bộ 01-05 của module, check xem còn khớp code không. Đây là "debt collection" của documentation.

---

## 10. Common mistakes — lessons learned

| ❌ Sai | ✅ Đúng |
|-------|---------|
| Viết CR mô tả "làm như nào" (solution) nhiều hơn "vì sao" (context) | Context rõ, solution chỉ mô tả delta |
| Copy spec từ 01-05 vào CR | Reference [BR-XX], [EP-XX], không copy |
| Update code xong mới nhớ update docs | Update docs trước, code sau, cùng PR |
| CR không có AC rõ ràng → AI/QA không test được | Mỗi CR ≥ 3 AC (1 happy + 2 error) |
| CR quá lớn (Tier L > 5 ngày) | Chia nhỏ thành Tier M |
| Hotfix xong quên retro CR | Set reminder 3 ngày sau hotfix |
| Impact matrix bỏ sót module → code merge xong mới phát hiện break module khác | Reviewer phải challenge Impact Matrix |
| Dùng CR cho tạo module mới | Dùng flow 01-05 gốc |
| Prompt Antigravity feed cả CR + toàn bộ 01-05 cho 5 module | Chỉ feed module bị chạm theo Impact Matrix |

---

## 11. FAQ

**Q: Một CR có 2 commit không? 2 PR không?**
A: 1 CR ≈ 1 PR là lý tưởng. Cross-module lớn có thể 1 CR = 2-3 PR, nhưng tất cả link về cùng 1 CR file.

**Q: CR đã merge xong, phát hiện miss case thì sao?**
A: Tạo CR mới (follow-up). KHÔNG sửa CR cũ.

**Q: Sprint này chưa xong CR, rollover sang sprint sau?**
A: Update field "Target sprint" trong Meta, status giữ "In Progress".

**Q: Nhiều CR chạm cùng 1 file 02-data-model.md trong cùng sprint — merge conflict sao?**
A: Thứ tự merge ưu tiên Tier L trước. Dev sau rebase, giải conflict cẩn thận (đọc cả 2 CR để hiểu ý).

**Q: AI sinh code không khớp với CR delta thì sao?**
A: Sửa lại prompt (thường do thiếu context hoặc CR delta không đủ rõ). Đừng chấp nhận code sai rồi sửa sau.

**Q: File CR có giữ lại mãi không? Dọn dẹp khi nào?**
A: GIỮ MÃI. Đó là lịch sử audit. Archive vào `docs/changes/archive/{year}/` sau 1 năm nếu thư mục quá đông.