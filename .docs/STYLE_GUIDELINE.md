# 🎯 Giao diện & Design System (Style Guideline)

Tài liệu này định nghĩa hệ thống Design System chuẩn hóa cho dự án **Hệ thống Tuyển dụng & Tìm việc (HR Portal)**. Mọi giao diện (viết tay hoặc sinh bằng AI) phải tuân thủ nghiêm ngặt các quy tắc thiết kế này.

Giao diện target: Trang quản trị & tuyển dụng dành cho Doanh nghiệp (Employer Dashboard) và Trang thông tin cá nhân của Ứng viên (Candidate Profile).
- **Tone thiết kế**: Chuyên nghiệp, sạch sẽ (clean), hiện đại, độ tập trung và mật độ thông tin cao.
- **Brand color**: Emerald Green (xanh ngọc lục bảo) làm chủ đạo, đem lại cảm giác tin cậy, tươi mới và cơ hội thành công.

---

# 🛠 Tech Stack Frontend

- **Framework**: React 18+ (Functional Components)
- **Language**: TypeScript strict mode
- **Build Tool**: Vite
- **Styling**: **SCSS** + **CSS Variables** (design tokens) — KHÔNG dùng Tailwind, KHÔNG dùng Material UI, KHÔNG dùng PrimeReact.
- **State Selection**: **React State / Context API** (không dùng Redux).
- **Icons**: Dùng bộ icon SVG inline hoặc từ gói `lucide-react`.
- **Font**: **Be Vietnam Pro** (Google Fonts) — Hỗ trợ tiếng Việt hoàn hảo, hiện đại. Weights: 400, 500, 600, 700.

---

# 🎨 Design Tokens

Tất cả tokens phải được định nghĩa trong `src/styles/_tokens.scss` và export ra `:root` dưới dạng CSS variables. Các component chỉ được phép dùng `var(--token)`.

## 1. Colors

```scss
:root {
  /* === Brand (Emerald Green) === */
  --color-brand-primary:        #00B14F;   /* Emerald Green - tông màu chính của sàn tuyển dụng */
  --color-brand-primary-dark:   #008B3E;
  --color-brand-primary-soft:   #E6F7ED;

  /* === Sidebar (Dark Navy Slate) === */
  --color-sidebar-bg:          #111827;   /* slate-900 */
  --color-sidebar-bg-hover:    #1F2937;   /* slate-800 */
  --color-sidebar-bg-active:   #374151;   /* slate-700 */
  --color-sidebar-text:        #F9FAFB;
  --color-sidebar-text-muted:  #9CA3AF;
  --color-sidebar-border:      #1F2937;

  /* === Header (Light) === */
  --color-header-bg:           #FFFFFF;
  --color-header-border:       #E5E7EB;
  --color-header-text:         #111827;

  /* === Surface === */
  --color-bg-app:              #F3F4F6;   /* main background */
  --color-bg-card:             #FFFFFF;
  --color-bg-subtle:           #F9FAFB;
  --color-bg-input:            #FFFFFF;

  /* === Text === */
  --color-text-primary:        #111827;
  --color-text-secondary:      #4B5563;
  --color-text-muted:          #9CA3AF;
  --color-text-inverse:        #FFFFFF;

  /* === Border === */
  --color-border-default:      #E5E7EB;
  --color-border-strong:       #D1D5DB;
  --color-border-focus:        #00B14F;   /* Viền xanh khi focus */

  /* === Semantic Status (Trạng thái đơn hàng/tin tuyển dụng) === */
  --color-info:                #2563EB;   /* Blue - Trạng thái Đang xem xét */
  --color-info-bg:             #EFF6FF;
  --color-success:             #059669;   /* Green - Đã nhận việc / Đang đăng tuyển */
  --color-success-bg:          #ECFDF5;
  --color-warning:             #D97706;   /* Orange/Amber - Chờ duyệt / Lịch hẹn phỏng vấn */
  --color-warning-bg:          #FEF3C7;
  --color-danger:              #DC2626;   /* Red - Từ chối ứng tuyển / Tin tuyển dụng bị khoá */
  --color-danger-bg:           #FEE2E2;

  /* === Overlay === */
  --color-overlay:             rgba(17, 24, 39, 0.5);
}
```

## 2. Typography

```scss
:root {
  --font-family-base: "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Font sizes (rem-based, root 16px) */
  --font-size-xs:   0.6875rem;  /* 11px */
  --font-size-sm:   0.8125rem;  /* 13px - table text */
  --font-size-base: 0.875rem;   /* 14px - body default */
  --font-size-md:   0.9375rem;  /* 15px - input fields */
  --font-size-lg:   1rem;       /* 16px - section headers */
  --font-size-xl:   1.125rem;   /* 18px - page title */
  --font-size-2xl:  1.375rem;   /* 22px */

  /* Line heights */
  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-loose:  1.75;

  /* Font weights */
  --font-weight-regular: 400;
  --font-weight-medium:  500;
  --font-weight-semibold: 600;
  --font-weight-bold:    700;
}
```

## 3. Spacing (scale 4px)
`--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`

## 4. Layout Dimensions (Kích thước khung)
- `--layout-sidebar-width`: 80px (dạng rút gọn hiển thị icon + nhãn ngắn)
- `--layout-sidebar-width-expanded`: 240px (khi di chuột qua hoặc mở rộng)
- `--layout-header-height`: 72px
- `--layout-footer-height`: 36px
- `--layout-content-max-width`: 1600px

---

# 🏗 Cấu trúc Layout (Shell Layout)

```
┌──────┬─────────────────────────────────────────────┐
│      │                 HEADER (72px)               │
│ SIDE ├─────────────────────────────────────────────┤
│ BAR  │                                             │
│(80px)│              MAIN CONTENT                   │
│      │              (scrollable)                   │
│      │                                             │
│      ├─────────────────────────────────────────────┤
│      │                FOOTER (36px)                │
│      └─────────────────────────────────────────────┘
```

- **Sidebar**: `position: fixed`, left: 0, full height, bg màu tối (`--color-sidebar-bg`), ngăn cách phân vùng chức năng rõ rệt.
- **Header**: `position: fixed`, top: 0, left: 80px, height 72px, bg trắng (`--color-header-bg`), có border-bottom mảnh.
- **Main Content**: `margin-left: 80px`, `margin-top: 72px`, padding 16px (`--space-4`), cuộn nội dung độc lập.

---

# 📁 File Structure (React)

```
src/
├── app/
│   ├── App.tsx                       # Root component, cấu hình Router
│   ├── core/
│   │   ├── layout/
│   │   │   ├── AppShell/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   └── AppShell.module.scss
│   │   │   ├── Sidebar/
│   │   │   ├── Header/
│   │   │   └── Footer/
│   │   ├── config/
│   │   │   └── sidebarMenu.config.ts  # Cấu hình danh mục menu tuyển dụng
│   │   ├── hooks/
│   │   └── services/
│   ├── shared/
│   │   └── ui/                       # Các UI Elements cơ bản
│   │       ├── Button/
│   │       ├── Input/
│   │       ├── Select/
│   │       ├── Badge/
│   │       ├── Card/
│   │       └── DatePicker/
│   └── features/
│       └── jobs/                     # Module demo Quản lý tin tuyển dụng
│           ├── pages/
│           │   └── JobPage/
│           │       ├── JobPage.tsx
│           │       └── JobPage.module.scss
│           └── components/
```

---

# ⚠️ Quy tắc thiết kế nghiêm ngặt
- ❌ KHÔNG dùng Tailwind CSS hoặc thư viện ngoài (AntD, MaterialUI, PrimeReact). Chỉ viết custom bằng SCSS.
- ❌ KHÔNG hardcode mã màu HEX ngoài tệp `_tokens.scss`. Phải dùng biến CSS `var(--color-...)`.
- ❌ Căn lề các số liệu và mức lương nằm bên phải bảng dữ liệu hoặc ô nhập liệu.