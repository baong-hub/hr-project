# HR Portal System Conventions

> **Status**: v1.0 — Official  
> **Last updated**: 2026-08-19  
> **Scope**: File này định nghĩa tất cả quy ước code, đặt tên, và định dạng của dự án Hệ thống Tuyển dụng & Tìm việc (HR Portal). Mọi code viết tay hoặc do AI sinh ra bắt buộc phải tuân thủ nghiêm ngặt quy chuẩn này.

---

## 1. Database Conventions

### 1.1 Naming (Đặt tên)

| Đối tượng | Quy ước | Ví dụ |
|-----------|---------|-------|
| Tên bảng | `snake_case`, **số nhiều** | `jobs`, `candidates`, `employers`, `applications`, `interviews` |
| Tên cột | `snake_case` | `title`, `salary_from`, `salary_to`, `created_at` |
| Primary key | `id`, kiểu `INT UNSIGNED AUTO_INCREMENT` | `id` |
| Foreign key | `{tên_bảng_số_ít}_id` | `job_id`, `candidate_id`, `employer_id` |
| Index | `idx_{table}_{columns}` | `idx_jobs_posted_at` |
| Unique index | `uq_{table}_{columns}` | `uq_users_email` |
| Foreign key constraint | `fk_{table}_{ref_table}` | `fk_applications_jobs` |
| Bảng nối many-to-many | `{a}_{b}` số nhiều, sắp xếp alphabet | `job_tags`, `candidate_skills` |

### 1.2 Kiểu dữ liệu chuẩn

| Loại | Kiểu MySQL | Ghi chú |
|------|-----------|---------|
| ID | `INT UNSIGNED` | PK và FK đều dùng |
| Boolean | `TINYINT(1)` | 0/1 |
| Enum | `VARCHAR(30)` | Tránh dùng kiểu ENUM của MySQL để dễ mở rộng và tương thích tốt với .NET Enum |
| Chuỗi ngắn | `VARCHAR(n)` | Chọn `n` sát với thực tế (`VARCHAR(100)`, không lạm dụng `VARCHAR(255)`) |
| Chuỗi dài | `TEXT` | Dùng cho mô tả công việc, yêu cầu công việc |
| Tiền tệ/Lương | `DECIMAL(18,2)` | Dùng cho trường mức lương cụ thể, tránh dùng Float/Double |
| Thời gian | `DATETIME(6)` | Giờ Local (Vietnam UTC+7), độ chính xác 6 chữ số thập phân |
| Ngày | `DATE` | Dùng cho ngày sinh, ngày hết hạn tin tuyển dụng |
| JSON | `JSON` | Chỉ dùng cho các trường động phức tạp (như danh sách các liên kết xã hội) |

### 1.3 Audit columns (bắt buộc cho mọi bảng nghiệp vụ)

```sql
created_at   DATETIME(6)      NOT NULL,
updated_at   DATETIME(6)      NOT NULL,
deleted_at   DATETIME(6)      NULL, -- Sử dụng Soft Delete
```

Quy tắc:
- Mọi câu truy vấn nghiệp vụ mặc định phải lọc các bản ghi chưa bị xóa (`deleted_at IS NULL`).
- Tuyệt đối không xóa vật lý (Hard Delete) qua các API nghiệp vụ thông thường.

### 1.4 Ví dụ schema hoàn chỉnh

```sql
CREATE TABLE jobs (
  id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  employer_id       INT UNSIGNED    NOT NULL,
  title             VARCHAR(150)    NOT NULL,
  description       TEXT            NOT NULL,
  requirements      TEXT            NOT NULL,
  benefits          TEXT            NULL,
  salary_from       DECIMAL(18,2)   NULL,
  salary_to         DECIMAL(18,2)   NULL,
  status            VARCHAR(30)     NOT NULL, -- DRAFT, PENDING, PUBLISHED, EXPIRED, CLOSED
  city              VARCHAR(50)     NOT NULL,
  expired_at        DATE            NOT NULL,
  created_at        DATETIME(6)     NOT NULL,
  updated_at        DATETIME(6)     NOT NULL,
  deleted_at        DATETIME(6)     NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_jobs_employers FOREIGN KEY (employer_id) REFERENCES employers(id),
  INDEX idx_jobs_status_expired (status, expired_at),
  INDEX idx_jobs_employer (employer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## 2. API Conventions

### 2.1 URL & HTTP method

- Base path: `/api/v1/`
- Resource name: **kebab-case**, **số nhiều**
- Phương thức HTTP tuân theo chuẩn RESTful:

| Method | Mục đích | Path ví dụ |
|--------|----------|-----------|
| GET | Lấy danh sách | `GET /api/v1/jobs` |
| GET | Lấy chi tiết | `GET /api/v1/jobs/{id}` |
| POST | Tạo mới | `POST /api/v1/jobs` |
| PUT | Cập nhật toàn bộ | `PUT /api/v1/jobs/{id}` |
| PATCH | Cập nhật 1 phần | `PATCH /api/v1/jobs/{id}/status` |
| DELETE | Xóa mềm | `DELETE /api/v1/jobs/{id}` |

Sub-resource: `GET /api/v1/jobs/{id}/applications` (Lấy danh sách đơn ứng tuyển của một tin tuyển dụng).

### 2.2 Query parameters (API lấy danh sách)

| Param | Mục đích | Ví dụ |
|-------|----------|-------|
| `page` | Trang cần lấy (1-based) | `?page=1` |
| `pageSize` | Số bản ghi trên trang (tối đa 100) | `?pageSize=20` |
| `sort` | Trường sắp xếp, dấu `-` ở trước tương ứng với DESC | `?sort=-created_at` |
| `search` | Tìm kiếm văn bản chung (tiêu đề, tên công ty) | `?search=dotnet` |
| `filter[status]` | Lọc theo trường cụ thể | `?filter[status]=PUBLISHED` |

### 2.3 Response format chuẩn (Đầu ra API)

**Success — single (Một bản ghi)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Senior .NET Developer",
    "status": "PUBLISHED"
  },
  "error": null
}
```

**Success — list (Danh sách bản ghi có phân trang)**:
```json
{
  "success": true,
  "data": [
    { "id": 1, "title": ".NET Dev" },
    { "id": 2, "title": "React Dev" }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 54,
    "totalPages": 3
  },
  "error": null
}
```

**Error (Lỗi nghiệp vụ/Hệ thống)**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "Không tìm thấy tin tuyển dụng yêu cầu.",
    "details": [
      { "field": "id", "message": "ID không tồn tại trên hệ thống" }
    ]
  }
}
```

### 2.4 Error Code nghiệp vụ
Định dạng: `UPPER_SNAKE_CASE`, bắt đầu bằng tên module.
```
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
JOB_NOT_FOUND
JOB_ALREADY_EXPIRED
APPLICATION_ALREADY_SUBMITTED
APPLICATION_NOT_FOUND
CV_FILE_TOO_LARGE
PERMISSION_DENIED
VALIDATION_FAILED
```

---

## 3. C# / .NET Conventions

### 3.1 Quy tắc đặt tên (Naming Conventions)

| Đối tượng | Quy ước | Ví dụ |
|------|-----------|---------|
| Class, Record, Struct, Enum | `PascalCase` | `Job`, `CreateJobCommand` |
| Interface | `PascalCase` + `I` prefix | `IJobRepository` |
| Method | `PascalCase` | `CreateAsync`, `GetByIdAsync` |
| Property | `PascalCase` | `Title`, `SalaryFrom` |
| Local variable | `camelCase` | `var jobEntity = ...` |
| Private field | `_camelCase` | `_jobRepository` |
| Async method | Suffix `Async` | `CreateAsync` |

### 3.2 Đặt tên tệp theo pattern 1 Use Case = 1 Folder
```
HR.Application/Jobs/Commands/CreateJob/
├── CreateJobCommand.cs       ← record định nghĩa input DTO
├── CreateJobHandler.cs       ← xử lý logic nghiệp vụ
└── CreateJobValidator.cs     ← FluentValidation validate input
```

### 3.3 Template Command + Handler mẫu (Dành cho AI tham khảo)

**CreateJobCommand.cs**:
```csharp
using MediatR;

namespace HR.Application.Jobs.Commands.CreateJob;

public record CreateJobCommand(
    string Title,
    string Description,
    string Requirements,
    string? Benefits,
    decimal? SalaryFrom,
    decimal? SalaryTo,
    string City,
    DateTime ExpiredAt
) : IRequest<JobDto>;
```

**CreateJobValidator.cs**:
```csharp
using FluentValidation;

namespace HR.Application.Jobs.Commands.CreateJob;

public class CreateJobValidator : AbstractValidator<CreateJobCommand>
{
    public CreateJobValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Requirements).NotEmpty();
        RuleFor(x => x.City).NotEmpty();
        RuleFor(x => x.ExpiredAt).GreaterThan(DateTime.UtcNow)
            .WithMessage("Hạn ứng tuyển phải lớn hơn thời điểm hiện tại");
        
        RuleFor(x => x.SalaryFrom)
            .LessThanOrEqualTo(x => x.SalaryTo)
            .When(x => x.SalaryFrom.HasValue && x.SalaryTo.HasValue)
            .WithMessage("Lương tối thiểu không được lớn hơn lương tối đa");
    }
}
```

**CreateJobHandler.cs**:
```csharp
using MediatR;
using Mapster;
using HR.Domain.Entities;
using HR.Application.Common.Interfaces;

namespace HR.Application.Jobs.Commands.CreateJob;

public class CreateJobHandler : IRequestHandler<CreateJobCommand, JobDto>
{
    private readonly IJobRepository _jobRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dateTime;

    public CreateJobHandler(
        IJobRepository jobRepository,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTime)
    {
        _jobRepository = jobRepository;
        _currentUser = currentUser;
        _dateTime = dateTime;
    }

    public async Task<JobDto> Handle(CreateJobCommand request, CancellationToken cancellationToken)
    {
        // 1. Tạo entity từ Request DTO
        var job = new Job
        {
            EmployerId = _currentUser.EmployerId ?? throw new ForbiddenException("Chỉ nhà tuyển dụng mới có quyền đăng tin"),
            Title = request.Title.Trim(),
            Description = request.Description,
            Requirements = request.Requirements,
            Benefits = request.Benefits,
            SalaryFrom = request.SalaryFrom,
            SalaryTo = request.SalaryTo,
            City = request.City,
            Status = JobStatus.Pending, // Chờ duyệt
            ExpiredAt = request.ExpiredAt,
            CreatedAt = _dateTime.Now,
            UpdatedAt = _dateTime.Now
        };

        // 2. Lưu vào CSDL
        await _jobRepository.AddAsync(job, cancellationToken);
        await _jobRepository.SaveChangesAsync(cancellationToken);

        // 3. Map kết quả trả về DTO
        return job.Adapt<JobDto>();
    }
}
```

---

## 4. React / TypeScript Conventions

### 4.1 Quy tắc đặt tên tệp và thư mục

| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| Component Folder & File | `PascalCase` | `JobCard/JobCard.tsx` |
| Custom Hook | `useCamelCase` | `useJob.ts` |
| Service | `camelCase.service.ts` | `job.service.ts` |
| Model (Interface) | `camelCase.model.ts` | `job.model.ts` |

### 4.2 TypeScript Model chuẩn

**job.model.ts**:
```typescript
export interface Job {
  id: number;
  employerId: number;
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  salaryFrom?: number;
  salaryTo?: number;
  status: JobStatus;
  city: string;
  expiredAt: string;
  createdAt: string;
}

export type JobStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'EXPIRED' | 'CLOSED';

export interface CreateJobDto {
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  salaryFrom?: number;
  salaryTo?: number;
  city: string;
  expiredAt: string;
}
```

### 4.3 Service API Client chuẩn

**job.service.ts**:
```typescript
import { apiClient } from '@/core/services/apiClient';
import { ApiResponse, Job, CreateJobDto } from '../models/job.model';

const BASE_URL = '/api/v1/jobs';

export const jobService = {
  getAll(params?: any): Promise<ApiResponse<Job[]>> {
    return apiClient.get(BASE_URL, { params });
  },

  getById(id: number): Promise<ApiResponse<Job>> {
    return apiClient.get(`${BASE_URL}/${id}`);
  },

  create(dto: CreateJobDto): Promise<ApiResponse<Job>> {
    return apiClient.post(BASE_URL, dto);
  },
};
```

---

## 5. Git & Commit Conventions

### 5.1 Branch naming
- Phát triển tính năng: `feature/HR-{ticket_id}-{short_desc}` (Ví dụ: `feature/HR-101-job-post-api`)
- Sửa lỗi: `bugfix/HR-{ticket_id}-{short_desc}`
- Hotfix: `hotfix/HR-{ticket_id}-{short_desc}`

### 5.2 Commit Message (Conventional Commits)
Format: `<type>(<scope>): <subject>`
- `feat(job): add API for creating new job postings`
- `fix(auth): resolve token refresh timing issue`
- `docs(readme): update system setup instructions`
