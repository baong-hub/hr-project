# 📋 Guideline: Màn hình Danh sách (List Screen)

Tài liệu này định nghĩa cấu trúc chuẩn (Pattern) cho mọi màn hình dạng danh sách trong hệ thống HR Portal (Danh sách tin tuyển dụng, Danh sách ứng viên, Danh sách đơn ứng tuyển, Báo cáo...). Đây là tài liệu mở rộng của `STYLE_GUIDELINE.md`.

---

## 1. Phân loại Màn hình List

Hệ thống có 2 loại giao diện danh sách chính:

| Loại màn hình | Đặc điểm | Thao tác cột Action | Ví dụ thực tế |
|---|---|---|---|
| **Business List** | Có các thao tác CRUD dữ liệu nghiệp vụ | ✅ Có (Sửa, Xem, Xóa) | Danh sách tin tuyển dụng, Hồ sơ ứng viên, Tài khoản doanh nghiệp |
| **Report List** | Xem dữ liệu báo cáo thống kê tĩnh | ❌ Không | Báo cáo số lượt click, Thống kê hiệu suất tuyển dụng |

---

## 2. Giải phẫu Giao diện (Anatomy)

```
┌────────────────────────────────────────────────────────────────────┐
│  📌 TITLE AREA                                                     │
│  Danh sách tin tuyển dụng    [+ Đăng tuyển mới][↑ Nhập][📥 Xuất]    │
│  (H1 Title)                                                        │
├────────────────────────────────────────────────────────────────────┤
│  🔍 FILTER PANEL (card)                                            │
│  Từ khoá : [input]      Ngành nghề : [select]   Địa điểm: [select] │
│  Mức lương: [select]    Trạng thái : [select]                      │
│                                                                    │
│              [🔍 Tìm kiếm]  [↻ Xoá lọc]                             │
├────────────────────────────────────────────────────────────────────┤
│  📊 DATA TABLE (card)                                              │
│  ┌──────┬──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ ⚙ ↕ │ Mã tin ↕ │ Tiêu đề ↕│ Lương ↕  │ Số nộp ↕ │Trạng thái│   │
│  ├──────┼──────────┼──────────┼──────────┼──────────┼──────────┤   │
│  │✎👁🗑│ JOB001   │ .NET Dev │ 15-25 tr │ 14       │Đang tuyển│   │
│  │✎👁🗑│ JOB002   │ React Dev│ Thỏa thuận│ 8        │Chờ duyệt │   │
│  └──────┴──────────┴──────────┴──────────┴──────────┴──────────┘   │
│   ▲                                                                │
│   └── Sticky cố định cột Action khi scroll ngang                   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Xem [10▾] / 134 bản ghi        [‹][1][2][3]...[13][14][›]    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Khu vực Tiêu đề (Title Area)
- Gồm: Tiêu đề trang (H1) căn trái và cụm nút Action căn phải.
- Nút chính (Primary Action): Luôn ở vị trí đầu tiên, ví dụ: `+ Đăng tuyển mới` — sử dụng tông màu xanh `--color-brand-primary` để thu hút sự chú ý.
- Nút phụ (Secondary Actions): `Nhập Excel`, `Xuất file`.

---

## 4. Bộ lọc tìm kiếm (Filter Panel)
- Được bọc trong thẻ `<div className="ui-card">` màu trắng, border mảnh 1px.
- Quy chuẩn bố cục trường lọc: Grid 3 cột ở Desktop (≥ 1280px), 2 cột ở Tablet (768-1279px), 1 cột ở Mobile (< 768px).
- Nút bấm bộ lọc: Căn giữa ở dòng dưới cùng của Panel gồm: `Tìm kiếm` (nền xanh thương hiệu) và `Xóa bộ lọc` (nền xám).
- **Quy tắc quan trọng**: KHÔNG tự động gửi yêu cầu tìm kiếm khi thay đổi các ô nhập liệu/dropdown. Chỉ thực thi lọc dữ liệu khi bấm nút `Tìm kiếm` hoặc ấn phím `Enter` trong ô nhập từ khóa.

---

## 5. Bảng Dữ liệu (Data Table)

### 5.1 Cấu trúc cột từ trái qua phải
1. **Cột Action (⚙)**: Chứa các biểu tượng thao tác nhanh (Sửa ✎, Xem 👁, Xóa 🗑). Chỉ hiển thị ở Business List.
2. **Cột Primary Key (Mã tin/Mã hồ sơ)**: Hiển thị dạng thẻ link màu xanh (`--color-info`), có hover underline để click xem chi tiết nhanh.
3. **Các cột dữ liệu nghiệp vụ**.

### 5.2 Cố định cột Action (Sticky Action Column)
- Width cố định: **112px**.
- `position: sticky; left: 0; z-index: var(--z-sticky)`.
- Khi người dùng cuộn ngang bảng, cột Action phải giữ nguyên vị trí, tạo box-shadow nhẹ ngăn cách với các cột dữ liệu khác.
- Xóa bản ghi bắt buộc phải thông qua **Confirm Modal**: *"Bạn có chắc chắn muốn xóa bài đăng [Tiêu đề]? Hành động này không thể hoàn tác."*

### 5.3 Định dạng ô dữ liệu (Cell Content formatting)
- Căn lề trái cho text, căn lề phải cho cột số lượng, ngày tháng, và mức lương.
- Giá trị trống: Hiển thị dấu gạch ngang `—` màu xám `--color-text-muted`.
- Cột trạng thái: Render dạng Badge/Chip với màu sắc trạng thái đã định nghĩa ở `STYLE_GUIDELINE.md` (Đang tuyển - Green, Chờ duyệt - Amber, Từ chối/Đã đóng - Red).

---

## 6. Phân trang (Pagination)
Cấu trúc Flexbox ở chân Card bảng dữ liệu:
- Căn trái: Trình chọn số bản ghi trên trang `Xem [10 ▾] / 134 bản ghi`. Options cố định: **10, 50, 100, 200**.
- Căn phải: Cụm điều khiển phân trang trang trước `‹`, danh sách trang, trang tiếp `›`.
- Thuật toán tạo danh sách trang có dấu `…` (Ellipsis) khi số lượng trang lớn hơn 10:

```typescript
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 10) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current]);
  if (current - 1 >= 1) pages.add(current - 1);
  if (current + 1 <= total) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | '...')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      if (sorted[i] - sorted[i - 1] === 2) {
        result.push(sorted[i - 1] + 1);
      } else {
        result.push('...');
      }
    }
    result.push(sorted[i]);
  }
  return result;
}
```

---

## 7. Trang demo kiểm chứng `/tin-tuyen-dung`

Dùng để xác thực và chạy thử nghiệm thiết kế lưới danh sách tin tuyển dụng.

### 7.1 Cấu hình
- **Tiêu đề**: "Quản lý tin tuyển dụng"
- **Nút hành động**: `+ Đăng tuyển mới` (Primary), `Xuất báo cáo Excel` (Success)
- **Bộ lọc**: Từ khóa (Tiêu đề/Mã tin), Ngành nghề (Dropdown), Mức lương (Dropdown), Hình thức (Dropdown), Trạng thái (Dropdown).
- **Cột bảng**: Hành động (Sticky) | Mã tin (Link) | Tiêu đề | Ngành nghề | Lương tối đa | Hạn ứng tuyển | Số đơn ứng tuyển | Trạng thái.

### 7.2 Mock Data mẫu

| Mã tin | Tiêu đề | Ngành nghề | Lương tối đa | Hạn ứng tuyển | Số đơn nộp | Trạng thái |
|---|---|---|---|---|---|---|
| **JOB-001** | Senior .NET Developer | IT / Phần mềm | 35.000.000 ₫ | 2026-09-15 | 18 | `PUBLISHED` |
| **JOB-002** | UI/UX Designer | Mỹ thuật / Thiết kế | 22.000.000 ₫ | 2026-09-10 | 9 | `PENDING` |
| **JOB-003** | Marketing Executive | Tiếp thị / QC | 18.000.000 ₫ | 2026-08-30 | 25 | `PUBLISHED` |
| **JOB-004** | Tester (Manual/Auto) | IT / Phần mềm | 15.000.000 ₫ | 2026-08-10 | 5 | `EXPIRED` |