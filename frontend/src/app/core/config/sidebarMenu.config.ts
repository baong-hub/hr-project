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
    label: 'Quản lý việc làm',
    shortName: 'Việc làm',
    icon: 'Briefcase',
    route: '/jobs',
    code: 'menu:jobs'
  },
  {
    label: 'Hồ sơ & CV',
    shortName: 'CV',
    icon: 'FileText',
    route: '/cvs',
    code: 'menu:cvs'
  },
  {
    label: 'Quản lý ứng tuyển',
    shortName: 'Ứng tuyển',
    icon: 'Send',
    route: '/applications',
    code: 'menu:applications'
  },
  {
    label: 'Lịch phỏng vấn',
    shortName: 'Lịch phỏng vấn',
    icon: 'Calendar',
    route: '/interviews',
    code: 'menu:interviews'
  },
  {
    label: 'Trang doanh nghiệp',
    shortName: 'Doanh nghiệp',
    icon: 'Building2',
    route: '/companies',
    code: 'menu:companies'
  },
  {
    label: 'Việc làm đã lưu',
    shortName: 'Đã lưu',
    icon: 'Heart',
    route: '/candidate/saved-jobs',
    code: 'menu:saved-jobs'
  },
  {
    label: 'Trung tâm thông báo',
    shortName: 'Thông báo',
    icon: 'Bell',
    route: '/notifications',
    code: 'menu:notifications'
  },
  {
    label: 'Báo cáo & Thống kê',
    shortName: 'Báo cáo',
    icon: 'BarChart3',
    route: '/reports',
    code: 'menu:reports'
  },
  {
    label: 'Cấu hình hệ thống',
    shortName: 'Cấu hình',
    icon: 'Settings',
    code: 'menu:system',
    children: [
      { label: 'Tài khoản', shortName: 'Tài khoản', icon: 'UserCog', route: '/users', code: 'module:user' },
      { label: 'Phân quyền', shortName: 'Phân quyền', icon: 'ShieldCheck', route: '/user-roles', code: 'module:user-role' },
      { label: 'Cấu hình chung', shortName: 'Cấu hình', icon: 'Sliders', route: '/user-settings/system-configs', code: 'module:system-setting' }
    ]
  }
];
