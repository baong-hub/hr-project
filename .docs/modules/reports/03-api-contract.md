# 03 — API Contract: Reports & Analytics

> **Purpose**: Định nghĩa chi tiết các API truy vấn báo cáo và thống kê số liệu của hệ thống.
> **Owner**: Dev  
> **Prerequisites**: `01-feature-spec.md`, `02-data-model.md` đã Approved.  
> **Related files**: `04-ui-spec.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `REP` |
| API base path | `/api/v1/reports` |
| Version | 1.0 |
| Status | Approved |
| Author | Team IT |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Endpoint

| ID | Method | Path | Purpose | Permission | US |
|----|--------|------|---------|-----------|-----|
| EP-01 | GET | `/api/v1/reports/employer/summary` | Lấy các chỉ số tổng hợp của Nhà tuyển dụng | `report:view` (Employer) | US-01 |
| EP-02 | GET | `/api/v1/reports/employer/funnel` | Lấy dữ liệu phễu tuyển dụng doanh nghiệp | `report:view` (Employer) | US-01 |
| EP-03 | GET | `/api/v1/reports/admin/summary` | Lấy số liệu tổng hợp tăng trưởng toàn sàn | `report:view_all` (Admin) | US-02 |

---

## 3. Chi tiết Endpoint

### 3.1 EP-01: Chỉ số tổng hợp của Nhà tuyển dụng

**Method & Path**: `GET /api/v1/reports/employer/summary`  
**Permission**: `report:view` (Employer đăng nhập)  
**Tham chiếu**: US-01, [BR-01], [BR-02]

**Query Parameters**:

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `from` | `string` | No | Format `YYYY-MM-DD`, mặc định = Today - 30 days [BR-01] |
| `to` | `string` | No | Format `YYYY-MM-DD`, mặc định = Today [BR-01] |

**Business Logic**:
- Lọc theo `employerId` của user đăng nhập [BR-02].
- Đếm tổng số tin đăng `PUBLISHED`, tổng số lượt nộp đơn `applications`, tổng số lượt click xem tin từ bảng `job_view_logs`.

**Response success** — `200 OK`  
Body: `ApiResponse<EmployerSummaryDto>`
```json
{
  "success": true,
  "data": {
    "totalActiveJobs": 12,
    "totalApplications": 145,
    "totalViews": 2840,
    "averageApplyRate": 5.1 // Tỷ lệ ứng tuyển trung bình (%)
  },
  "error": null
}
```

---

### 3.2 EP-02: Dữ liệu phễu tuyển dụng doanh nghiệp

**Method & Path**: `GET /api/v1/reports/employer/funnel`  
**Permission**: `report:view` (Employer)  
**Tham chiếu**: US-01, [BR-02]

**Response success** — `200 OK`  
Body: `ApiResponse<RecruitmentFunnelDto>`
```json
{
  "success": true,
  "data": {
    "stages": [
      { "stage": "SUBMITTED", "count": 145 },
      { "stage": "REVIEWING", "count": 92 },
      { "stage": "SHORTLISTED", "count": 35 },
      { "stage": "ACCEPTED", "count": 8 }
    ]
  },
  "error": null
}
```
