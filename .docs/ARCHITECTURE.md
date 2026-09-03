# Recruitment & Job Search System Architecture

> **Status**: v1.1 — Official  
> **Last updated**: 2026-08-19  
> **Owner**: Team IT / Development Team  
> **Scope**: Tài liệu này định nghĩa kiến trúc tổng thể hệ thống tuyển dụng và tìm việc trực tuyến (HR Portal). Mọi module mới trong hệ thống phải tuân thủ tài liệu này.

---

## 1. Bối cảnh & Mục tiêu

### 1.1 Bối cảnh
- Hệ thống được phát triển nhằm mục đích kết nối Ứng viên (Candidates) có nhu cầu tìm việc và Nhà tuyển dụng (Employers) có nhu cầu tuyển dụng nhân sự.
- Quy trình vận hành cốt lõi xoay quanh 3 nhóm đối tượng người dùng chính:
  1. **Ứng viên (Candidates)**: Đăng ký tài khoản, quản lý thông tin cá nhân, cập nhật hồ sơ năng lực, tải lên hoặc tạo CV trực tuyến, tìm kiếm tin tuyển dụng theo các tiêu chí (ngành nghề, mức lương, địa điểm), nộp đơn ứng tuyển (Apply), lưu việc làm quan tâm và theo dõi các nhà tuyển dụng hàng đầu.
  2. **Nhà tuyển dụng (Employers)**: Đăng ký tài khoản doanh nghiệp, cập nhật trang thông tin công ty (Company Profile), tạo và đăng tin tuyển dụng, quản lý danh sách hồ sơ ứng tuyển, thay đổi trạng thái đơn tuyển dụng, đặt lịch phỏng vấn và gửi phản hồi cho ứng viên.
  3. **Quản trị viên (Admin)**: Quản lý người dùng, kiểm duyệt thông tin đăng ký doanh nghiệp, phê duyệt/moderation tin tuyển dụng trước khi hiển thị công khai, cấu hình hệ thống và theo dõi các báo cáo thống kê hiệu suất sàn.
- Team: 1 developer.
- Dùng Antigravity AI assistant để hỗ trợ phát triển code theo spec `.md`.

### 1.2 Mục tiêu kiến trúc
1. **Nhất quán**: Mọi module được thiết kế theo cùng một khuôn mẫu (pattern) để AI sinh code ổn định, dễ bảo trì và mở rộng.
2. **Dễ review**: Dev ít phải đoán ý AI, code theo cấu trúc Clean Architecture đã định hình sẵn.
3. **Đơn giản & Hiệu quả**: Phát triển nhanh, gọn nhẹ, tránh tối đa việc over-engineer.
4. **Phân quyền chặt chẽ**: Đảm bảo an toàn thông tin cá nhân của ứng viên và dữ liệu tuyển dụng của doanh nghiệp.

### 1.3 Phạm vi Module & Các nhóm loại bỏ (Out of Scope)
- **Các nhóm nghiệp vụ chính**:
  1. Xác thực & Phân quyền (`authentication`).
  2. Quản lý Tin tuyển dụng (`jobs`).
  3. Hồ sơ ứng viên & CV (`cv_profiles`).
  4. Quy trình Ứng tuyển (`applications`).
  5. Lịch hẹn phỏng vấn (`interviews`).
  6. Trang thông tin công ty & thương hiệu doanh nghiệp (`companies`).
  7. Việc làm đã lưu & tương tác ứng viên (`saved_jobs`).
  8. Hệ thống thông báo đẩy & lịch sử thông báo (`notifications`).
  9. Thống kê & Báo cáo (`reports`).
- **Các nhóm nghiệp vụ cũ (CRM/HIS)**: Bị loại bỏ hoàn toàn khỏi hệ thống mới để tập trung 100% vào nghiệp vụ tuyển dụng.

---

## 2. Tech Stack

| Layer | Technology | Ghi chú |
|-------|-----------|---------|
| Database | MySQL 8.x | Hệ cơ sở dữ liệu quan hệ chính |
| ORM | Entity Framework Core 10 | Dùng LINQ, không dùng raw SQL trừ trường hợp đặc biệt cần tối ưu |
| Backend | .NET 10 | Theo yêu cầu |
| API style | RESTful JSON | Không dùng GraphQL hay gRPC |
| Mediator | MediatR | CQRS pattern tách biệt Command và Query |
| Validation | FluentValidation | Validate DTO ở lớp Application |
| Mapping | Mapster | Nhẹ hơn AutoMapper, tối giản boilerplate |
| Logging | Serilog | Ghi file (rolling) + console |
| API Docs | Swagger / OpenAPI | Auto-gen từ controller |
| Auth | JWT (access + refresh) | Tự implement, lưu refresh token ở DB để hỗ trợ revoke |
| Background Jobs | Hangfire | Xử lý gửi email thông báo, nhắc lịch phỏng vấn, quét tin tuyển dụng hết hạn |
| Real-time | SignalR / WebSockets | Hỗ trợ đẩy thông báo tức thời (real-time notifications) lên giao diện Web |
| Frontend | React 18 | Functional Components, React Router v6, lazy-loading |
| UI lib | Custom SCSS + Design Tokens | KHÔNG dùng Tailwind, Material UI, PrimeReact |
| State | useState / useReducer + Context API | **Không dùng Redux** — đảm bảo ứng dụng nhẹ nhàng |
| Testing BE | xUnit + FluentAssertions | Unit + Integration tests |
| Testing FE | Vitest + React Testing Library | Test api client services/hooks & router guards |

---

## 3. Backend Architecture — Clean Architecture

### 3.1 Sơ đồ layer

```
┌─────────────────────────────────────────────┐
│  HR.API            (Web / Presentation)     │  Controllers, Middleware, Filters, SignalR Hubs
├─────────────────────────────────────────────┤
│  HR.Application    (Use cases)              │  Commands, Queries, Handlers, DTOs
├─────────────────────────────────────────────┤
│  HR.Domain         (Business core)          │  Entities, Value Objects, Enums
├─────────────────────────────────────────────┤
│  HR.Infrastructure (External concerns)      │  EF Core, Repositories, JWT, Mail/SMS Services, SignalR Hub Impl
└─────────────────────────────────────────────┘
```

**Quy tắc dependency**: Dependency chỉ hướng vào trong.
- `HR.API` → `HR.Application` → `HR.Domain`
- `HR.Infrastructure` → `HR.Application` → `HR.Domain`
- `HR.Domain` **không phụ thuộc** bất kỳ project nào khác.
- `HR.Application` **không phụ thuộc** `HR.Infrastructure` (phụ thuộc ngược qua interface).

### 3.2 Trách nhiệm từng layer

#### HR.Domain
- Entities (ví dụ: `User`, `Candidate`, `Employer`, `Job`, `Application`, `Interview`, `Company`, `SavedJob`, `Notification`)
- Value Objects (ví dụ: `PhoneNumber`, `EmailAddress`, `SalaryRange`)
- Enums, hằng số nghiệp vụ (ví dụ: `JobStatus`, `ApplicationStatus`, `NotificationType`)
- Domain exceptions
- Không chứa code liên quan đến EF Core, DB hoặc HTTP.

#### HR.Application
- Commands (`CreateJobCommand`, `SubmitApplicationCommand`, `ScheduleInterviewCommand`, `ToggleSaveJobCommand`, `ReadNotificationCommand`...)
- Queries (`GetJobsQuery`, `GetApplicationsForEmployerQuery`, `GetCompanyDetailsQuery`, `GetNotificationsQuery`...)
- Command/Query Handlers
- DTOs (request + response)
- Validators (FluentValidation)
- Interfaces cho Infrastructure (ví dụ: `IJobRepository`, `IMailService`, `ICurrentUserService`, `INotificationHub`)
- Không có logic truy cập DB trực tiếp.

#### HR.Infrastructure
- `ApplicationDbContext` (EF Core)
- Entity configurations (`IEntityTypeConfiguration<T>`)
- Cài đặt các interface từ Application (`JobRepository`, `JwtTokenService`, `MailService`, `SignalRNotificationHub`...)
- Migrations

#### HR.API
- Controllers (nhận HTTP request, gọi Mediator gửi Command/Query và trả kết quả)
- Middleware (bắt Exception toàn cục, log request, xử lý CORS)
- Hubs (SignalR Hubs cho kết nối thông báo real-time)
- Program.cs (DI setup, cấu hình Hangfire & JWT)
- appsettings.json

---

## 4. Frontend Architecture — React

- **React 18** với **Functional Components** mặc định.
- **Routing**: React Router v6, lazy-load các module qua `React.lazy` + `Suspense`.
- **Giao diện**: Custom SCSS kết hợp CSS Variables Design Tokens (`_tokens.scss`), không dùng Tailwind CSS hay thư viện ngoài.
- **State Management**: Sử dụng `useState`/`useReducer` + React Context API. Không dùng Redux.
- **Real-time Notifications Hook**: Sử dụng `@microsoft/signalr` kết nối tới Notification Hub, cập nhật số lượng thông báo chưa đọc tức thời trên thanh Header.

---

## 5. Database Architecture

### 5.1 Nguyên tắc chung
- MySQL 8.x, character set `utf8mb4`, collation `utf8mb4_0900_ai_ci`.
- Sử dụng Soft Delete bằng cách cấu hình Query Filter mặc định `deleted_at IS NULL`.
- Mọi bảng nghiệp vụ đều bắt buộc có cột audit (`created_at`, `updated_at`, `deleted_at`).

### 5.2 Sơ đồ ERD mức cao (Luồng Tuyển dụng & Tương tác)

```
companies (thông tin công ty)
  │ 1
  ├── N employers (1-1) ──< jobs ──< applications >── candidates (1-1) ──> users
  │                                      │                                  │
  │                                      └──< interviews                    └── N notifications
  │
  └────────────────── N candidate_follows (theo dõi doanh nghiệp)
```

---

## 6. Authentication & Authorization

### 6.1 Authentication — JWT
- **Access Token**: Hết hạn sau 15 phút, chứa thông tin `userId`, `role` (CANDIDATE / COMPANY_OWNER / HR_MANAGER / RECRUITER / HIRING_MANAGER / ADMIN), và các `permissions`.
- **Refresh Token**: Hết hạn sau 7 ngày, lưu ở DB để có thể thu hồi (revoke).

### 6.2 Authorization — Role & Permission-based (RBAC)
Hệ thống sử dụng mô hình Phân quyền dựa trên Quyền hạn (Permission-based) kết hợp với Vai trò (Role) trong doanh nghiệp:

| Role | Permissions | Mô tả quyền hạn |
|------|-------------|-----------------|
| **CANDIDATE** | `job:search`, `job:apply`, `cv:manage`, `interview:view`, `company:view`, `job:save`, `notification:view`, `report:create` | Ứng viên tìm việc |
| **COMPANY_OWNER** | `company:manage`, `hr:manage`, `job:post`, `job:manage`, `cv:search`, `interview:schedule`, `billing:view`, `notification:view`, `analytics:view` | Chủ doanh nghiệp (Quyền cao nhất của Employer) |
| **HR_MANAGER** | `job:post`, `job:manage`, `cv:search`, `interview:schedule`, `candidate:ats`, `notification:view`, `analytics:view` | Trưởng phòng nhân sự (ATS & Quản lý Job/Interview) |
| **RECRUITER** | `cv:search`, `interview:schedule`, `candidate:screen`, `notification:view` | Chuyên viên tuyển dụng (Sàng lọc hồ sơ, xếp lịch hẹn) |
| **HIRING_MANAGER** | `cv:search`, `interview:evaluate`, `candidate:approve`, `notification:view` | Quản lý chuyên môn (Đánh giá chuyên môn, phỏng vấn) |
| **ADMIN** | `employer:verify`, `job:moderate`, `user:manage`, `report:moderate`, `company:update`, `notification:view_all`, `payment:manage` | Quản trị viên hệ thống |

### 6.3 Scope dữ liệu (Data Isolation & Scope)
Để bảo mật dữ liệu, các Query Handlers bắt buộc kiểm tra thông tin người dùng từ `ICurrentUserService`:
- **Ứng viên**: Chỉ truy vấn và cập nhật được CV, đơn ứng tuyển, thông tin cá nhân, danh sách việc làm đã lưu và thông báo của chính mình.
- **Employer Roles (Owner, HR, Recruiter, HM)**: Chỉ xem và quản lý dữ liệu thuộc phạm vi công ty của họ (`company_id = currentUser.CompanyId`). Quyền hạn cụ thể được kiểm soát chi tiết theo Role tương ứng.
- **Admin**: Được phép xem và xử lý toàn bộ dữ liệu hệ thống phục vụ mục đích kiểm duyệt, xử lý báo cáo vi phạm, thanh toán/giao dịch.

### 6.4 State Machine & workflows quan trọng

#### A. Company Verification Flow
Doanh nghiệp đăng ký sẽ qua quy trình xác minh nghiêm ngặt để chống tin tuyển dụng lừa đảo:
`DRAFT` (Bản nháp) -> `PENDING_VERIFICATION` (Chờ Admin duyệt) -> `VERIFIED` (Đã xác minh) | `REJECTED` (Từ chối / Yêu cầu thêm thông tin) | `SUSPENDED` (Bị tạm ngưng hoạt động).

#### B. Job Status Lifecycle
`DRAFT` (Nháp) -> `SUBMIT` -> `PENDING_REVIEW` (Chờ Admin duyệt) -> `APPROVED` -> `PUBLISHED` (Đang đăng tuyển) -> `PAUSED` (Tạm dừng) / `EXPIRED` (Hết hạn) -> `CLOSED` (Đã đóng).

#### C. Application State Machine
Luồng chuyển đổi trạng thái của Đơn ứng tuyển (Ứng viên ứng tuyển -> Tuyển dụng):
```
                    ┌─────────────┐
                    │   APPLIED   │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │  SCREENING  │
                    └──────┬──────┘
                           ↓
                  ┌─────────────────┐
                  │   SHORTLISTED   │
                  └────────┬────────┘
                           ↓
                    ┌─────────────┐
                    │  INTERVIEW  │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │    OFFER    │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │    HIRED    │
                    └─────────────┘

* Nhánh Thất bại: Bất kỳ giai đoạn nào (APPLIED -> OFFER) đều có thể chuyển thành REJECTED (Bởi HR).
* Nhánh Hủy bỏ: Ứng viên có quyền chuyển trạng thái thành WITHDRAWN (Rút hồ sơ) tại bất kỳ thời điểm nào trước khi có kết quả tuyển dụng.
```

---

## 7. Background Jobs (Hangfire) & Real-time Notifications

- **Sự kiện ứng tuyển**: Khi ứng viên ứng tuyển thành công:
  1. Hangfire gửi email thông báo cho Nhà tuyển dụng.
  2. Hệ thống tạo bản ghi trong bảng `notifications` và gọi Hub đẩy thông báo thời gian thực (SignalR) cho Doanh nghiệp.
- **Sự kiện phỏng vấn**: Khi Nhà tuyển dụng tạo lịch phỏng vấn:
  1. Tạo lịch hẹn Hangfire nhắc lịch trước 2 tiếng qua email.
  2. Tạo thông báo tức thời (SignalR Push) cho Ứng viên hiển thị trên biểu tượng chuông.

---

## 8. Quy trình phát triển một module tuyển dụng mới

1. **Bước 1**: Viết `01-feature-spec.md` (Xác định rõ các câu chuyện người dùng US-xx và quy tắc nghiệp vụ BR-xx).
2. **Bước 2**: Viết `02-data-model.md` (Thiết kế thực thể ERD).
3. **Bước 3**: Viết `03-api-contract.md` (Định nghĩa endpoint RESTful).
4. **Bước 4**: Viết `04-ui-spec.md` (Đặc tả layout và component).
5. **Bước 5**: Viết `05-test-plan.md` (Lập danh sách kịch bản kiểm thử).
6. **Bước 6**: Đưa tài liệu vào Antigravity AI để tự động tạo khung code và triển khai logic nghiệp vụ.

---

## 9. Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-19 | IT Team | Chuyển đổi toàn diện từ CRM Getfly sang hệ thống Tuyển dụng & Tìm việc trực tuyến |
| 1.1 | 2026-08-19 | IT Team | Bổ sung các phân hệ: `companies` (Trang doanh nghiệp), `saved_jobs` (Việc làm đã lưu) và `notifications` (Hệ thống thông báo đẩy real-time SignalR) |
