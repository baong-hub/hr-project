# Phân Hệ Dữ Liệu Danh Mục Dùng Chung (Master Data Module)

> **Mã phân hệ**: `MD`  
> **Mục tiêu**: Cung cấp cơ chế quản lý tập trung và phân phối toàn bộ danh mục dùng chung (Master Data / Lookups) cho toàn bộ nền tảng tuyển dụng: Kỹ năng chuyên môn, Cấp bậc công việc, Loại hình làm việc, Khu vực địa lý, v.v.  
> **Liên kết kỹ thuật**: `HR.Domain.Entities.MasterDataCategory`, `HR.API.Controllers.MasterDataController`.

---

## 1. Bối cảnh & Mục tiêu nghiệp vụ

Để đảm bảo tính nhất quán của dữ liệu trên toàn hệ thống (từ ứng viên tạo hồ sơ, nhà tuyển dụng đăng tin tuyển dụng, bộ lọc tìm kiếm, cho đến phân tích báo cáo), hệ thống sử dụng bảng danh mục `master_data_categories` chuẩn hóa thay vì hardcode chuỗi text tự do.

### Các loại danh mục phổ biến:
- `JOB_LEVEL`: Cấp bậc (Intern, Fresher, Junior, Middle, Senior, Lead, Manager, Director).
- `JOB_TYPE`: Hình thức làm việc (Full-time, Part-time, Contract, Internship).
- `WORK_MODE`: Chế độ làm việc (Onsite, Remote, Hybrid).
- `SKILL`: Bộ kỹ năng (C#, .NET, React, Vue, Python, Docker, Kubernetes, AWS, SQL Server, MySQL...).
- `LOCATION`: Tỉnh / Thành phố (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Cần Thơ...).
- `INDUSTRY`: Nhóm ngành nghề (Công nghệ thông tin, Tài chính ngân hàng, Bán lẻ, Y tế...).

---

## 2. Mô hình dữ liệu (Data Model)

### Bảng `master_data_categories`

| Tên trường | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `Id` | `int` | PK, Auto Increment | Mã định danh danh mục |
| `Type` | `varchar(50)` | Not Null, Index | Nhóm phân loại (e.g. `JOB_LEVEL`, `SKILL`, `WORK_MODE`) |
| `Code` | `varchar(50)` | Not Null | Mã viết tắt duy nhất trong loại (e.g. `SENIOR`, `REACT_JS`) |
| `Name` | `nvarchar(255)` | Not Null | Tên hiển thị giao diện tiếng Việt / Anh |
| `Description` | `nvarchar(500)` | Nullable | Mô tả giải thích bổ sung |
| `SortOrder` | `int` | Default 0 | Thứ tự hiển thị ưu tiên trên Dropdown/Select |
| `IsActive` | `bit` | Default 1 | Trạng thái kích hoạt (1: Đang dùng, 0: Ẩn) |
| `CreatedAt` | `datetime2` | Default `NOW()` | Ngày tạo |
| `UpdatedAt` | `datetime2` | Nullable | Ngày cập nhật gần nhất |
| `DeletedAt` | `datetime2` | Nullable | Thời gian xóa mềm (Soft Delete) |

---

## 3. API Contract (`/api/v1/master-data`)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/master-data` | `master-data:view` | Lấy danh sách danh mục (hỗ trợ filter `?type=SKILL`) |
| `GET` | `/api/v1/master-data/types` | `master-data:view` | Lấy danh sách tất cả các nhóm phân loại hiện có |
| `GET` | `/api/v1/master-data/{id}` | `master-data:view` | Lấy chi tiết một mục danh mục theo ID |
| `POST` | `/api/v1/master-data` | `master-data:create` | Thêm mới một mục danh mục |
| `PUT` | `/api/v1/master-data/{id}` | `master-data:update` | Chỉnh sửa thông tin danh mục |
| `DELETE` | `/api/v1/master-data/{id}` | `master-data:delete` | Xóa mềm danh mục |

---

## 4. Đặc điểm thiết kế & Khả năng mở rộng
- **Bộ nhớ đệm (Caching)**: Dữ liệu Master Data ít biến động, có thể cache trên Redis hoặc In-Memory Cache ở frontend để tối ưu thời gian phản hồi dưới 10ms.
- **Phân quyền chặt chẽ**: Chỉ có tài khoản mang quyền `master-data:*` (thường là Admin hệ thống) mới được quyền Create/Update/Delete. Người dùng thông thường chỉ gọi API đọc dữ liệu.
