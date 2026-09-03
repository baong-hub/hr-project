# Change Request (CR): CRM-014 - Nâng cấp Phân cấp & Phân quyền CRM và Phân quyền Dữ liệu Đệ quy

## 1. Thông tin chung
- **Mã CR**: `CRM-014`
- **Tên tính năng**: Nâng cấp Hệ thống Phân quyền Chức năng (Action-level), Phân quyền Dữ liệu (Data-level đệ quy cây cơ cấu tổ chức) & Khả năng Bypass cho tài khoản Admin.
- **Ngày yêu cầu**: 2026-08-06
- **Trạng thái**: Hoàn thành (Implemented & Verified)
- **Mức độ ảnh hưởng (Tier)**: Medium

---

## 2. Mô tả yêu cầu (Requirement Overview)
1. **Action-level Permission**:
   - Chuẩn hóa mã quyền theo dạng `{module}:{action}` (ví dụ: `leads:insert`, `customer:view`, `leads:view_phone_number`).
   - Hỗ trợ đánh dấu quyền tùy chỉnh riêng ở cấp User (`user_permissions.is_custom`). Khi đồng bộ quyền từ Role Template, giữ nguyên các quyền `is_custom = true` của User.
2. **Data-level Permission & Đệ quy Phòng ban**:
   - Mở rộng enum `DataScope`: `ALL = 1`, `SITE = 2`, `DEPARTMENT_TREE = 3`, `DEPARTMENT = 4`, `OWN = 5`.
   - Đệ quy lấy danh sách User IDs cấp dưới thuộc cây phòng ban (`crm_departments`) khi Trưởng phòng (`IsManager = true`) đăng nhập.
   - Thêm bảng `user_data_permissions` hỗ trợ gán chéo quyền xem dữ liệu trực tiếp giữa 2 User.
   - Khi đăng nhập/lấy thông tin User, trả về mảng `subordinateUserIds` để Frontend lưu `localStorage`.
   - Backend áp dụng bộ lọc `WHERE IN (allowedUserIds)` cho các Query Handlers (Leads, Customers, Tasks, Appointments).
3. **Bypass Phân quyền cho Tài khoản Admin**:
   - Cập nhật `CurrentUserService`: Khi tài khoản có `AccountType == Admin`, hoặc thuộc Role `Super Admin` / `Admin`, hoặc `MinRoleLevel == 0`, hệ thống tự động bypass tất cả các bước kiểm tra quyền (`HasPermission` trả về `true`, `GetDataScope` trả về `DataScope.ALL`).

---

## 3. Danh sách File thay đổi (Impact Matrix)

### Backend (.NET 10)
- `CRM.Domain/Enums/DataScope.cs`: Mở rộng enum `DataScope`.
- `CRM.Domain/Entities/UserPermission.cs`: Thêm thuộc tính `IsCustom`.
- `CRM.Domain/Entities/UserDataPermission.cs` [NEW]: Entity mới quản lý gán chéo quyền dữ liệu.
- `CRM.Infrastructure/Persistence/Configurations/EntityConfigurations.cs`: Cấu hình column `is_custom` và table `user_data_permissions`.
- `CRM.Application/Common/Interfaces/IOrganizationService.cs` [NEW] & `CRM.Infrastructure/Services/OrganizationService.cs` [NEW]: Service đệ quy cây phòng ban và gán chéo.
- `CRM.Infrastructure/Security/UserPermissionsHelper.cs`: Giữ quyền `IsCustom == true` khi đồng bộ.
- `CRM.Infrastructure/Services/CurrentUserService.cs`: Thêm logic bypass quyền cho `AccountType.Admin` & Role `Admin` / `Super Admin`.
- `CRM.Application/Auth/Commands.cs`, `CommandHandlers.cs`, `QueryHandlers.cs`: Trả kèm `subordinateUserIds` trong auth response.
- `CRM.Application/Leads/QueryHandlers.cs`: Lọc `DEPARTMENT_TREE` / `DEPARTMENT` theo `allowedUserIds`.
- `CRM.Application/Customers/QueryHandlers.cs`: Lọc `DEPARTMENT_TREE` / `DEPARTMENT` theo `allowedUserIds`.
- `CRM.Application/Tasks/Queries/GetLeadTasks/GetLeadTasksQuery.cs`: Lọc `DEPARTMENT_TREE` / `DEPARTMENT` theo `allowedUserIds`.
- `CRM.Application/Appointments/Queries/GetAppointments/GetAppointmentsHandler.cs`: Lọc `DEPARTMENT_TREE` / `DEPARTMENT` theo `allowedUserIds`.
- `CRM.Infrastructure/Migrations/20260806073958_AddUserPermissionIsCustomAndUserDataPermissions.cs` [NEW]: Database Migration.
- `tests/CRM.UnitTests/PermissionAndDataScopeTests.cs` [NEW]: Unit test cho `DataScope`, `IsCustom` và đệ quy `OrganizationService`.

### Frontend (React 18)
- `src/app/core/services/auth.service.ts`: Lưu `subordinate_user_ids` vào `localStorage` và thêm helper `getSubordinateUserIds()`.

---

## 4. Kiểm thử & Xác minh (Test Results)
- **Unit Tests**: Pass 100% (15/15 unit test cases passed).
- **Backend Build**: Clean build, 0 Errors, 0 Warnings (`dotnet build`).
- **Frontend Build**: Bundle thành công (`npm run build`).
