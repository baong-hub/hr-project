export interface SidebarItem {
  label: string;
  shortName?: string;
  icon: string;
  route?: string;
  code?: string; // Mã module/menu để check quyền
  children?: SidebarItem[];
}

export const SIDEBAR_MENU: SidebarItem[] = [
  {
    label: 'Quản lý khách hàng',
    icon: 'Users',
    code: 'menu:customer',
    children: [
      { label: 'Danh sách khách hàng', icon: 'List', route: '/customers', code: 'module:customer' },
      { label: 'Xét nghiệm', icon: 'FlaskConical', route: '/customers/lab', code: 'module:lab' },
      { label: 'Patient chart', icon: 'FileMedical', route: '/customers/chart', code: 'module:chart' },
      { label: 'Danh sách tiếp nhận', icon: 'UserClock', route: '/customers/reception', code: 'module:reception' },
      { label: 'Quản lý tiếp đón khách hàng', icon: 'UserPlus', route: '/customer-reception-manager', code: 'module:reception-manager' },
      { label: 'Khám và Điều trị', icon: 'Stethoscope', route: '/customers/treatment', code: 'module:treatment' },
      { label: 'Quản lý thẻ đã bán', icon: 'IdCard', route: '/customers/membership', code: 'module:membership' },
      { label: 'Chẩn đoán hình ảnh', icon: 'XRay', route: '/customers/imaging', code: 'module:imaging' },
      { label: 'Quản lý nhân viên thực hiện', icon: 'Users', route: '/customers/staff-assignments', code: 'module:staff-assignment' }
    ]
  },
  {
    label: 'Quản lý lịch hẹn',
    icon: 'Calendar',
    route: '/appointments',
    code: 'menu:appointment'
  },
  {
    label: 'Quản lý hóa đơn',
    icon: 'Receipt',
    code: 'menu:bill',
    children: [
      { label: 'Danh sách hóa đơn', icon: 'List', route: '/bills', code: 'module:bill' },
      { label: 'Quản lý đặt cọc', icon: 'Coins', route: '/deposits', code: 'deposit:view' },
      { label: 'Yêu cầu hoàn hủy', icon: 'Undo2', route: '/refund-requests', code: 'module:refund' }
    ]
  },
  {
    label: 'Quản lý Xét nghiệm',
    icon: 'FlaskConical',
    route: '/laboratory/worklist',
    code: 'lab_execution:view'
  },
  {
    label: 'Thực hiện dịch vụ',
    icon: 'Activity',
    route: '/service-executions',
    code: 'service_execution:view'
  },
  {
    label: 'Báo cáo',
    icon: 'BarChart3',
    code: 'menu:report',
    children: [
      { label: 'Danh sách báo cáo', icon: 'List', route: '/reports/revenue', code: 'menu:report' },
      { label: 'Quyền theo vai trò', icon: 'ShieldCheck', route: '/reports/permission-by-role', code: 'report-permission-by-role:view' },
      { label: 'Quyền theo người dùng', icon: 'UserCheck', route: '/reports/permission-by-user', code: 'report-permission-by-user:view' }
    ]
  },
  {
    label: 'Quản lý Kho',
    icon: 'Package',
    code: 'menu:inventory',
    children: [
      { label: 'Tổng quan', icon: 'LayoutDashboard', route: '/inventory', code: 'inventory:view' },
      { label: 'Phiếu Nhập/Xuất', icon: 'FileUpDown', route: '/inventory/transactions', code: 'inventory:view' },
      { label: 'Kiểm kê kho', icon: 'ClipboardList', route: '/inventory/stocktakes', code: 'inventory:stocktake' },
      { label: 'Yêu cầu pha chế', icon: 'ClipboardList', route: '/inpatient-orders', code: 'inpatient_order:view' },
      { label: 'Hệ thống Báo cáo', icon: 'BarChart4', route: '/inventory/reports', code: 'inventory:view' },
      { label: 'Cảnh báo & Cấu hình', icon: 'Bell', route: '/inventory/alerts', code: 'inventory:view' }
    ]
  },
  {
    label: 'Cấu hình hệ thống',
    icon: 'Settings',
    code: 'menu:system',

    children: [
      { label: 'Quản lý tài khoản', icon: 'UserCog', route: '/users', code: 'module:user' },
      { label: 'Vai trò & Quyền', icon: 'ShieldCheck', route: '/user-roles/roles', code: 'module:user-role' },
      { label: 'Gán quyền nhân viên', icon: 'UserPlus', route: '/user-roles/users', code: 'module:user-assignment' },
      { label: 'Quản lý vị trí', icon: 'Tag', route: '/admin/positions', code: 'staff:view' },
      { label: 'Gán vị trí NV', icon: 'UserPlus', route: '/admin/staff-positions', code: 'staff:view' }
    ]
  }
];
