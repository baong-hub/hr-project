# Cấu trúc dự án (Project Structure)

Dự án Hệ thống Tuyển dụng & Tìm việc (HR Portal) được thiết kế theo mô hình Clean Architecture cho Backend và Component-based architecture cho Frontend.

## 1. Backend (.NET 10)

```
d:/Projects/HR/backend/
├── src/
│   ├── HR.API/                 # Lớp Presentation (RESTful API, Controllers, Middleware)
│   ├── HR.Application/         # Lớp Use Cases (CQRS, MediatR, FluentValidation, Business Logic)
│   ├── HR.Domain/              # Lớp Core (Entities, Value Objects, Domain Events, Enums)
│   └── HR.Infrastructure/      # Lớp Data/External (EF Core, ApplicationDbContext, Repositories, Services)
├── tests/
│   ├── HR.API.Tests/
│   ├── HR.Application.Tests/
│   ├── HR.Domain.Tests/
│   └── HR.Infrastructure.Tests/
└── HR.slnx
```

## 2. Frontend (React 18)

Sử dụng cấu trúc App Shell + Functional Components với lazy-loading (React.lazy + Suspense).
Không dùng TailwindCSS, sử dụng SCSS + CSS Variables Design Tokens.

```
d:/Projects/HR/frontend/
src/
├── app/
│   ├── App.tsx                       # Root component, router config
│   ├── routes.tsx                    # route config với React.lazy
│   ├── core/
│   │   ├── layout/
│   │   │   ├── AppShell/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   └── AppShell.module.scss
│   │   │   ├── Sidebar/
│   │   │   ├── Header/
│   │   │   └── Footer/
│   │   ├── config/
│   │   │   └── sidebarMenu.config.ts
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── services/
│   │       └── apiClient.ts
│   ├── shared/
│   │   └── ui/
│   │       ├── Button/
│   │       ├── Input/
│   │       ├── Select/
│   │       ├── Badge/
│   │       ├── Card/
│   └── ui/
│       ├── Button/
│       ├── Input/
│       ├── Select/
│       ├── Badge/
│       ├── Card/
│       ├── Icon/
│       └── DatePicker/
│   └── features/
│       ├── jobs/                     # Đăng tuyển, quản lý tin tuyển dụng, tìm kiếm việc làm
│       ├── cvs/                      # Quản lý hồ sơ ứng viên, tải lên/tạo CV trực tuyến
│       ├── applications/             # Quản lý quy trình ứng tuyển, nộp hồ sơ, duyệt đơn
│       ├── interviews/               # Lịch hẹn phỏng vấn (tạo lịch, gửi thông báo)
│       ├── employers/                # Quản lý thông tin nhà tuyển dụng
│       ├── companies/                # Trang thông tin doanh nghiệp, tìm kiếm công ty
│       ├── saved_jobs/               # Việc làm đã lưu, theo dõi công ty của ứng viên
│       └── notifications/            # Trung tâm thông báo đẩy (Real-time Bell Notifications)
├── assets/
│   └── icons/                        # SVG sprite nếu dùng
├── styles/
│   ├── _tokens.scss                  # CSS variables (design tokens)
│   ├── _reset.scss                   # CSS reset
│   ├── _mixins.scss                  # helper mixins (focus-ring, truncate...)
│   ├── _typography.scss
│   └── main.scss                     # entry, import tất cả
└── main.tsx
```

## 3. Documents (.docs)

```
d:/Projects/HR/.docs/
├── modules/
│   ├── authentication/              # Xác thực & phân quyền JWT (Ứng viên/Nhà tuyển dụng)
│   ├── jobs/                        # Đặc tả Quản lý tin tuyển dụng
│   ├── cv_profiles/                 # Đặc tả Quản lý CV & Hồ sơ ứng viên
│   ├── applications/                # Đặc tả Ứng tuyển & Duyệt hồ sơ
│   ├── interviews/                  # Đặc tả Lịch hẹn phỏng vấn
│   ├── companies/                   # Đặc tả Trang doanh nghiệp & Thương hiệu
│   ├── saved_jobs/                  # Đặc tả Việc làm đã lưu & Theo dõi
│   ├── notifications/               # Đặc tả Trung tâm & Nhật ký thông báo
│   └── reports/                     # Đặc tả Báo cáo & Thống kê tuyển dụng
├── ARCHITECTURE.md                  # Kiến trúc hệ thống
├── CONVENTIONS.md                   # Tiêu chuẩn coding, quản lý mã nguồn
├── Hangfire-guide.md                # Hướng dẫn và code mẫu sử dụng Hangfire (Background/Cron Jobs)
├── PROJECT_STRUCTURE.md             # File này (Chi tiết cấu trúc dự án)
└── STYLE_GUIDELINE.md               # Tiêu chuẩn thiết kế giao diện đồng nhất
```