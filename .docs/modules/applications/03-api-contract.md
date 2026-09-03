# 03 — API Contract: Job Applications

> **Purpose**: Định nghĩa chi tiết giao tiếp API của phân hệ Ứng tuyển & Duyệt hồ sơ.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `APP` |
| API base path | `/api/v1/applications` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | POST | `/api/v1/applications` | Nộp hồ sơ ứng tuyển mới | `job:apply` | US-01 |
| EP-02 | GET | `/api/v1/applications` | Lấy danh sách hồ sơ ứng tuyển (Phân trang) | `job:apply` hoặc `job:manage` | US-02 |
| EP-03 | GET | `/api/v1/applications/{id}` | Xem chi tiết hồ sơ ứng tuyển | `job:apply` hoặc `job:manage` | US-03 |
| EP-04 | PATCH | `/api/v1/applications/{id}/status` | Cập nhật trạng thái duyệt hồ sơ | `job:manage` | US-03 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Nộp hồ sơ ứng tuyển mới

**Method & Path**: `POST /api/v1/applications`  
**Permission**: `job:apply` (Yêu cầu vai trò CANDIDATE đăng nhập)  
**Tham chiếu**: US-01, [BR-01], [BR-02], [BR-04], [E-01]

**Request body** — `SubmitApplicationDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `jobId` | `int` | Yes | `> 0`, tin đăng phải tồn tại | ID tin tuyển dụng ứng tuyển |
| `candidateCvId`| `int` | Yes | `> 0`, CV phải của candidate hiện tại | ID CV đính kèm |
| `coverLetter` | `string?` | No | Max 3000 ký tự | Thư xin việc viết kèm |

**Business validation ở Handler**:
- [BR-01] Kiểm tra xem candidate đã nộp đơn vào tin tuyển dụng này chưa. Nếu rồi, ném lỗi `APPLICATION_ALREADY_SUBMITTED`.
- [BR-02] Kiểm tra trạng thái tin tuyển dụng: Tin tuyển dụng phải ở trạng thái `PUBLISHED` và `ExpiredAt >= Today`. Nếu không, ném lỗi `JOB_NOT_ACTIVE`.

**Response success** — `201 Created`  
Body: `ApiResponse<ApplicationDto>`

---

### 3.2 EP-04: Cập nhật trạng thái duyệt hồ sơ

**Method & Path**: `PATCH /api/v1/applications/{id}/status`  
**Permission**: `job:manage` (Chỉ Nhà tuyển dụng sở hữu tin đăng mới có quyền gọi)  
**Tham chiếu**: US-03, [BR-03]

**Request body** — `ChangeApplicationStatusDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `status` | `string` | Yes | SUBMITTED, REVIEWING, SHORTLISTED, ACCEPTED, REJECTED | Trạng thái mới |

**Business validation ở Handler**:
- Lấy đơn ứng tuyển hiện tại: Nếu đang ở trạng thái `ACCEPTED` hoặc `REJECTED` thì ném lỗi `APPLICATION_STATUS_FINAL` (Không được thay đổi trạng thái khi đã kết thúc) [BR-03].
- Kiểm tra quyền sở hữu: Tin tuyển dụng của đơn nộp phải thuộc `employerId` của user hiện tại.

**Response success** — `200 OK`  
Body: `ApiResponse<bool>`

---

## 4. DTO Models (Response Shapes)

### 4.1 `ApplicationDto`
```typescript
export interface ApplicationDto {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  candidateId: number;
  candidateName: string;
  candidateCvId: number;
  cvFileUrl: string;
  coverLetter?: string;
  status: string;
  appliedAt: string;
}
```

---

## 5. Danh mục Mã lỗi nghiệp vụ

| HTTP Status | Error Code | Message | Giải thích |
|-------------|------------|---------|------------|
| 400 | `VALIDATION_FAILED` | Dữ liệu đầu vào không hợp lệ | Thiếu trường hoặc vượt dung lượng ký tự |
| 409 | `APPLICATION_ALREADY_SUBMITTED` | Bạn đã nộp đơn ứng tuyển cho công việc này | Chặn nộp trùng lặp [BR-01] |
| 400 | `JOB_NOT_ACTIVE` | Tin tuyển dụng đã đóng hoặc đã hết hạn | Hết hạn nộp [BR-02] |
| 400 | `APPLICATION_STATUS_FINAL` | Trạng thái đơn nộp đã hoàn thành, không thể sửa đổi | Chặn đổi trạng thái khi đã chốt [BR-03] |
| 404 | `APPLICATION_NOT_FOUND` | Đơn ứng tuyển không tồn tại | ID đơn nộp không tồn tại |
