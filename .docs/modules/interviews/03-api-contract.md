# 03 — API Contract: Interview Scheduling

> **Purpose**: Định nghĩa toàn bộ API của phân hệ Lịch hẹn phỏng vấn.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `INT` |
| API base path | `/api/v1/interviews` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | POST | `/api/v1/interviews` | Lên lịch phỏng vấn mới | `interview:schedule` | US-01 |
| EP-02 | GET | `/api/v1/interviews/{id}` | Chi tiết một lịch phỏng vấn | `interview:view` | US-01, US-02 |
| EP-03 | GET | `/api/v1/interviews` | Lấy danh sách lịch phỏng vấn (Phân trang) | `interview:view` | US-01, US-02 |
| EP-04 | PATCH | `/api/v1/interviews/{id}/respond` | Ứng viên phản hồi lời mời | `interview:respond` | US-02 |
| EP-05 | PATCH | `/api/v1/interviews/{id}/cancel` | Hủy lịch phỏng vấn | `interview:schedule` | US-01 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Lên lịch phỏng vấn mới

**Method & Path**: `POST /api/v1/interviews`  
**Permission**: `interview:schedule` (Yêu cầu Doanh nghiệp đăng nhập)  
**Tham chiếu**: US-01, [BR-01], [BR-02], [BR-03], [E-01]

**Request body** — `ScheduleInterviewDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `applicationId` | `int` | Yes | `> 0`, đơn nộp phải tồn tại | ID đơn ứng tuyển |
| `startTime` | `DateTime` | Yes | ISO 8601 UTC, `> now` [BR-01] | Thời điểm bắt đầu |
| `endTime` | `DateTime` | Yes | `> startTime` | Thời điểm kết thúc |
| `interviewType` | `string` | Yes | ONLINE hoặc OFFLINE | Hình thức phỏng vấn |
| `locationOrLink`| `string` | Yes | Max 255 ký tự | Địa chỉ hoặc link zoom/meet |
| `notes` | `string?` | No | | Lời nhắn dặn dò |

**Business validation ở Handler**:
- [BR-02] Kiểm tra trạng thái đơn ứng tuyển: Phải ở trạng thái `SHORTLISTED` (Sơ tuyển). Nếu không, ném lỗi `INTERVIEW_INVALID_APPLICATION_STATUS`.

**Response success** — `201 Created`  
Body: `ApiResponse<InterviewDto>`

---

### 3.2 EP-04: Ứng viên phản hồi lời mời phỏng vấn

**Method & Path**: `PATCH /api/v1/interviews/{id}/respond`  
**Permission**: `interview:respond` (Chỉ ứng viên nhận lời mời mới được gọi)  
**Tham chiếu**: US-02

**Request body** — `RespondInterviewDto`:

| Field | Type | Required | Validation | Mô tả |
|-------|------|----------|------------|-------|
| `accept` | `boolean` | Yes | True: Đồng ý, False: Từ chối | Đồng ý tham dự hay từ chối |
| `reason` | `string?` | No | Bắt buộc khi từ chối (`accept = false`) | Lý do từ chối |

**Response success** — `200 OK`  
Body: `ApiResponse<bool>`

---

## 4. DTO Models (Response Shapes)

### 4.1 `InterviewDto`
```typescript
export interface InterviewDto {
  id: number;
  applicationId: number;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  startTime: string;
  endTime: string;
  interviewType: string;
  locationOrLink: string;
  notes?: string;
  status: string;
}
```

---

## 5. Danh mục Mã lỗi nghiệp vụ

| HTTP Status | Error Code | Message | Giải thích |
|-------------|------------|---------|------------|
| 400 | `VALIDATION_FAILED` | Dữ liệu đầu vào không hợp lệ | Thời gian đặt trong quá khứ [BR-01] |
| 400 | `INTERVIEW_INVALID_APPLICATION_STATUS` | Đơn ứng tuyển chưa được sơ tuyển | Đơn nộp không ở trạng thái SHORTLISTED [BR-02] |
| 404 | `INTERVIEW_NOT_FOUND` | Lịch phỏng vấn không tồn tại | ID lịch hẹn sai |
| 403 | `INTERVIEW_FORBIDDEN` | Bạn không được phép thao tác trên lịch hẹn này | Can thiệp lịch hẹn của người khác |
