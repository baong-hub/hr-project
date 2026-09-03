# 04 — UI Specification: Notifications Management

> **Purpose**: Định nghĩa giao diện Trung tâm thông báo, trạng thái quả chuông trên Header và kết nối truyền tin thời gian thực phía Client.
> **Owner**: Dev + BA  
> **Prerequisites**: `01-feature-spec.md`, `03-api-contract.md` đã Approved.  
> **Related files**: `STYLE_GUIDELINE.md`

---

## 1. Meta

| Field | Value |
|-------|-------|
| Module code | `NOT` |
| Feature folder | `src/app/features/notifications/` |
| Route prefix | Không có (Tích hợp dạng Component chung trong Header) |
| Version | 1.0 |
| Status | Approved |
| Last updated | 2026-08-19 |

---

## 2. Danh sách Component (UI Elements)

| ID | Component Name | Mục đích | Vị trí hiển thị |
|----|----------------|----------|-----------------|
| UI-01 | `NotificationBell` | Quả chuông hiển thị số lượng tin chưa đọc | Nằm bên phải thanh Header chính |
| UI-02 | `NotificationDropdown` | Khung danh sách trượt xuống hiển thị 10 tin gần nhất | Xuất hiện khi click vào `NotificationBell` |
| UI-03 | `NotificationToast` | Popup thông báo nhỏ xuất hiện góc màn hình (Toast) | Góc dưới bên phải (Bottom Right) |

---

## 3. Đặc tả giao diện chi tiết

### 3.1 UI-01 & UI-02: Quả chuông & Popover danh sách (Header Bell Dropdown)
- **Bố cục (Layout)**:
  - Một biểu tượng quả chuông (Bell Icon) có số lượng chưa đọc hình tròn màu đỏ đè lên ở góc trên bên phải (chỉ hiện số nếu số lượng `> 0`).
  - Khi click vào quả chuông, mở khung Popover (width 360px):
    - **Header**: Text "Thông báo" và nút "Đánh dấu tất cả đã đọc" (link style xanh).
    - **Body (List)**: Cuộn danh sách các tin thông báo:
      - Tin chưa đọc (`isRead = false`): Nền xám nhạt (`--color-bg-subtle`), có chấm tròn xanh thương hiệu ở cạnh.
      - Tin đã đọc: Nền trắng, text nhạt hơn.
      - Mỗi dòng thông báo hiển thị: Icon loại thông báo, tiêu đề, thời gian nhận dạng tương đối (ví dụ: "5 phút trước", "2 giờ trước").
    - **Footer**: Link "Xem tất cả thông báo" (dẫn đến trang lịch sử toàn bộ).

**Tương tác (Interactions)**:
- Click vào một dòng thông báo:
  - Gọi API EP-03 để cập nhật trạng thái đã đọc (`isRead = true`).
  - Đóng Dropdown.
  - Chuyển hướng người dùng sang `redirectUrl` đính kèm [US-02].

---

### 3.2 Kết nối thời gian thực SignalR (Real-time connection flow)
- Giao diện Client sử dụng SignalR Hub Client kết nối đến WebSocket URL `/hubs/notifications` ngay khi khởi tạo ứng dụng thành công (đã đăng nhập).
- Sự kiện SignalR lắng nghe:
  - **Event `ReceiveNotification`**: Khi nhận được payload thông báo từ server:
    1. Tăng chỉ số unread-count ở Header thêm 1 [US-01].
    2. Gọi hiển thị Component `NotificationToast` góc màn hình chứa nội dung tóm tắt để người dùng nhận biết ngay lập tức [BR-03].
    3. Đẩy tin mới vào đầu mảng danh sách `NotificationDropdown` nếu đang mở.
- Khi người dùng đăng xuất: Ngắt kết nối Hub SignalR ngay lập tức.
