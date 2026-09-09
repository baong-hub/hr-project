import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SIDEBAR_MENU, type SidebarItem } from '../../config/sidebarMenu.config';
import { Icon } from '../../../shared/ui/Icon/Icon';
import styles from './Sidebar.module.scss';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { authService } from '../../services/auth.service';

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ expanded, onToggle }: SidebarProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [menus, setMenus] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(new Set());

  const user = authService.getUser();
  const companyLogo = user?.companyLogo || '/hr.png';
  const companyCode = user?.companyCode || 'HR';
  const permissions = (user?.permissions as string[]) || [];
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isSuperAdmin = roles.includes('Super Admin') || roles.includes('super_admin') || user?.username === 'admin' || userRole === 'Admin' || userRole === 'ADMIN';
  const isCandidate = userRole === 'CANDIDATE' || userRole === 'User' || roles.includes('Ứng viên');
  const isEmployer = userRole === 'EMPLOYER' || userRole === 'Company' || roles.includes('Nhà tuyển dụng') || roles.includes('Employer');

  // Auto-expand accordion when active route is a child item
  useEffect(() => {
    menus.forEach((item) => {
      if (item.children && item.children.length > 1) {
        const hasActiveChild = item.children.some(
          (child) => child.route && (location.pathname === child.route || location.pathname.startsWith(child.route + '/'))
        );
        if (hasActiveChild) {
          setExpandedSubmenus((prev) => new Set([...prev, item.label]));
        }
      }
    });
  }, [location.pathname, menus]);

  const hasPermission = (code?: string, route?: string) => {
    // 1. Ẩn hoàn toàn "Khu vực ứng viên" đối với Admin và Nhà tuyển dụng (chỉ dành riêng cho Ứng viên)
    if (isSuperAdmin || isEmployer || !isCandidate) {
      if (
        code === 'menu:candidate' ||
        code === 'module:candidate' ||
        code === 'menu:saved-jobs' || 
        code === 'module:saved-jobs' || 
        code === 'job:save' ||
        code === 'saved-jobs:view' ||
        code === 'menu:candidate-applications' ||
        code === 'module:candidate-applications' ||
        code === 'menu:candidate-offers' ||
        code === 'module:candidate-offers' ||
        route === '/candidate/saved-jobs' || 
        route === '/saved-jobs' || 
        route?.includes('/saved-jobs') ||
        route?.startsWith('/candidate/')
      ) {
        return false;
      }
    }

    // Đối với ứng viên, các mục trong khu vực ứng viên luôn được phép truy cập
    if (isCandidate) {
      if (
        code === 'menu:candidate' ||
        code === 'module:candidate' ||
        code === 'menu:candidate-applications' ||
        code === 'module:candidate-applications' ||
        code === 'menu:candidate-offers' ||
        code === 'module:candidate-offers' ||
        code === 'menu:saved-jobs' ||
        code === 'module:saved-jobs' ||
        route === '/candidate/applications' ||
        route === '/candidate/offers' ||
        route === '/candidate/saved-jobs' ||
        route?.startsWith('/candidate/')
      ) {
        return true;
      }
    }

    if (isSuperAdmin) return true;
    if (!code && !route) return true;

    // 2. Ẩn các tính năng của Nhà tuyển dụng/Admin đối với ứng viên
    if (isCandidate && (
      code === 'menu:applications' || 
      code === 'module:applications' || 
      code === 'menu:assessments' || 
      code === 'module:assessments' || 
      code === 'menu:talent-pool' ||
      code === 'module:talent-pool' ||
      code === 'menu:system' ||
      code?.startsWith('module:user') ||
      code?.startsWith('module:system') ||
      code === 'menu:reports' ||
      route === '/employer/candidates' ||
      route?.startsWith('/employer/') ||
      route === '/applications' || 
      (route?.startsWith('/applications/') && !route?.startsWith('/candidate/')) ||
      route === '/reports' ||
      route?.startsWith('/reports/') ||
      route?.includes('/user-settings') ||
      route?.includes('/users') ||
      route?.includes('/user-roles')
    )) {
      return false;
    }

    // Direct permission match
    if (code && permissions.includes(code)) return true;

    // Module/Menu to permission mappings for HR Portal
    const permMap: Record<string, string[]> = {
      'menu:jobs': ['jobs:view', 'jobs:create'],
      'module:jobs': ['jobs:view'],
      'menu:cvs': ['cvs:view', 'cvs:create'],
      'module:cvs': ['cvs:view'],
      'menu:applications': ['applications:view', 'applications:create'],
      'module:applications': ['applications:view'],
      'menu:talent-pool': ['cv:search', 'cvs:view', 'job:manage', 'jobs:view'],
      'menu:assessments': ['job:manage', 'jobs:view', 'applications:view'],
      'module:assessments': ['job:manage', 'jobs:view', 'applications:view'],
      'menu:candidate': ['job:apply', 'jobs:view', 'saved-jobs:view'],
      'module:candidate': ['job:apply', 'jobs:view', 'saved-jobs:view'],
      'menu:candidate-applications': ['job:apply', 'applications:view', 'jobs:view'],
      'module:candidate-applications': ['job:apply', 'applications:view', 'jobs:view'],
      'menu:candidate-offers': ['offer:view', 'job:apply', 'jobs:view'],
      'module:candidate-offers': ['offer:view', 'job:apply', 'jobs:view'],
      'menu:interviews': ['interviews:view', 'interviews:create'],
      'module:interviews': ['interviews:view'],
      'menu:companies': ['companies:view', 'companies:create'],
      'module:companies': ['companies:view'],
      'menu:saved-jobs': ['saved-jobs:view', 'job:save'],
      'module:saved-jobs': ['saved-jobs:view', 'job:save'],
      'menu:messages': ['messages:view', 'messages:send'],
      'module:messages': ['messages:view', 'messages:send'],
      'menu:notifications': ['notifications:view', 'notification:view'],
      'module:notifications': ['notifications:view', 'notification:view'],
      'menu:reports': ['reports:view', 'report:view'],
      'module:reports': ['reports:view', 'report:view'],
      'menu:system': ['user:view', 'user-role:view', 'system:view'],
      'module:system-setting': ['system:view', 'user:view'],
      'module:user': ['user:view', 'user:create', 'user:update'],
      'module:user-role': ['user-role:view', 'user-role:manage', 'user-role:assign'],
      'module:site': ['site:view'],
      'module:master-data': ['master-data:view', 'master-data:create', 'master-data:update'],
      'module:organization': ['organization:view', 'organization:create', 'organization:update']
    };

    if (code && permMap[code]) {
      const matched = permMap[code].some(p => permissions.includes(p));
      if (matched) return true;
    }

    if (code) {
      const cleanCode = code.replace(/^module:|^menu:/, '');
      if (permissions.some(p => p === cleanCode || p.startsWith(cleanCode + ':') || p.startsWith(cleanCode + '_'))) {
        return true;
      }
    }

    // Role-based route fallbacks
    if (route) {
      if (route.includes('/candidate/') || route === '/saved-jobs') {
        return isCandidate || isSuperAdmin;
      }
      if (route.includes('/employer/')) {
        return isEmployer || isSuperAdmin;
      }
      if (route.includes('/user-roles') || route.includes('/users') || route.includes('/user-settings')) {
        return isSuperAdmin || permissions.includes('user:view') || permissions.includes('user-role:view');
      }
    }

    // Candidate defaults
    if (isCandidate) {
      const candidateAllowed = [
        'menu:jobs', 
        'module:jobs',
        'menu:cvs', 
        'module:cvs',
        'menu:candidate',
        'module:candidate',
        'menu:candidate-applications', 
        'module:candidate-applications',
        'menu:candidate-offers', 
        'module:candidate-offers',
        'menu:interviews', 
        'module:interviews',
        'menu:companies', 
        'module:companies',
        'menu:saved-jobs', 
        'module:saved-jobs',
        'menu:messages', 
        'module:messages',
        'menu:notifications',
        'module:notifications'
      ];
      if (code && candidateAllowed.includes(code)) return true;
    }

    // Employer defaults
    if (isEmployer) {
      const employerAllowed = [
        'menu:jobs', 
        'module:jobs',
        'menu:cvs', 
        'module:cvs',
        'menu:applications', 
        'module:applications',
        'menu:talent-pool', 
        'module:talent-pool',
        'menu:assessments', 
        'module:assessments',
        'menu:interviews', 
        'module:interviews',
        'menu:companies', 
        'module:companies',
        'menu:messages', 
        'module:messages',
        'menu:notifications',
        'module:notifications',
        'menu:reports',
        'module:reports'
      ];
      if (code && employerAllowed.includes(code)) return true;
    }

    return false;
  };

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await authService.getAuthorizedMenus();
        if (response.success && response.data && response.data.length > 0) {
          const mapMenu = (m: any): SidebarItem => ({
            label: m.name || m.label,
            shortName: m.shortName,
            icon: m.icon || 'Menu',
            route: m.route,
            code: m.code,
            children: m.children && m.children.length > 0 
              ? m.children.map(mapMenu) 
              : undefined
          });
          const mapped = response.data.map(mapMenu);
          
          // Merge with predefined SIDEBAR_MENU so modern modules & group submenus are preserved
          const merged = SIDEBAR_MENU.map(baseItem => {
            const fromApi = mapped.find((m: SidebarItem) => m.code === baseItem.code);
            if (!fromApi) return baseItem;

            // If baseItem defines multiple children (e.g. menu:candidate, menu:system), preserve them
            const children = (baseItem.children && baseItem.children.length > 1)
              ? baseItem.children
              : (fromApi.children && fromApi.children.length > 0 ? fromApi.children : baseItem.children);

            let route = baseItem.route || fromApi.route;
            if (baseItem.code === 'menu:applications' && (isEmployer || isSuperAdmin)) {
              route = '/employer/applications';
            }

            return {
              ...baseItem,
              ...fromApi,
              name: baseItem.label,
              label: baseItem.label,
              route,
              children
            };
          });
          setMenus(merged);
        } else {
          // Fallback to configured SIDEBAR_MENU
          setMenus(SIDEBAR_MENU);
        }
      } catch (error) {
        console.error('Failed to fetch sidebar menus, using default config:', error);
        setMenus(SIDEBAR_MENU);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const filterMenuItems = (items: SidebarItem[]): SidebarItem[] => {
    return items
      .map((item) => {
        // Ẩn menu Khu vực ứng viên đối với Admin và Nhà tuyển dụng (chỉ dành riêng cho ứng viên)
        if (isSuperAdmin || isEmployer || !isCandidate) {
          if (
            item.code === 'menu:candidate' ||
            item.code === 'module:candidate' ||
            item.code === 'menu:saved-jobs' ||
            item.code === 'module:saved-jobs' ||
            item.code === 'menu:candidate-applications' ||
            item.code === 'menu:candidate-offers' ||
            item.route?.startsWith('/candidate/') ||
            item.route === '/saved-jobs' ||
            item.label?.toLowerCase().includes('ứng viên') ||
            item.shortName?.toLowerCase().includes('ứng viên') ||
            item.label?.toLowerCase().includes('đã lưu') ||
            item.shortName?.toLowerCase().includes('đã lưu')
          ) {
            return null;
          }
        }

        // Ẩn menu quản lý ứng tuyển/tuyển dụng hoàn toàn đối với tài khoản ứng viên
        if (isCandidate && (
          item.code === 'menu:applications' ||
          item.code === 'module:applications' ||
          item.code === 'menu:talent-pool' ||
          item.code === 'menu:assessments' ||
          item.code === 'menu:reports' ||
          item.code === 'menu:system' ||
          item.route === '/applications' ||
          item.route === '/employer/applications' ||
          item.route === '/employer/candidates' ||
          item.route === '/employer/assessments' ||
          item.route === '/reports' ||
          item.label === 'Quản lý ứng tuyển' ||
          item.label === 'Hồ sơ ứng tuyển'
        )) {
          return null;
        }

        if (item.children && item.children.length > 0) {
          const visibleChildren = item.children.filter((child) => {
            if (isSuperAdmin || isEmployer || !isCandidate) {
              if (
                child.code === 'menu:candidate' ||
                child.code === 'menu:saved-jobs' ||
                child.code === 'module:saved-jobs' ||
                child.route === '/candidate/saved-jobs' ||
                child.route === '/saved-jobs' ||
                child.route?.startsWith('/candidate/') ||
                child.label?.toLowerCase().includes('đã lưu') ||
                child.shortName?.toLowerCase().includes('đã lưu')
              ) return false;
            }

            if (isCandidate && (
              child.code === 'menu:applications' || 
              child.route === '/applications' ||
              child.code === 'menu:talent-pool' ||
              child.route?.startsWith('/employer/')
            )) return false;

            return hasPermission(child.code, child.route);
          });
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        } else {
          if (!hasPermission(item.code, item.route)) return null;
          return item;
        }
      })
      .filter((item): item is SidebarItem => item !== null);
  };

  const toggleSubmenu = (label: string) => {
    if (!expanded) {
      onToggle();
      setExpandedSubmenus(new Set([label]));
      return;
    }

    const newSet = new Set(expandedSubmenus);
    if (newSet.has(label)) {
      newSet.delete(label);
    } else {
      newSet.add(label);
    }
    setExpandedSubmenus(newSet);
  };

  const getTranslatedLabel = (code?: string, defaultLabel?: string) => {
    const label = defaultLabel || '';
    if (code) {
      const cleanCode = code.replaceAll(':', '_').replaceAll('-', '_');
      const key = `sidebar.${cleanCode}`;
      if (i18n.exists(key)) {
        return t(key);
      }
    }
    
    if (label === 'Quản lý việc làm' || label === 'Việc làm') return t('sidebar.menu_jobs', 'Việc làm');
    if (label === 'Hồ sơ & CV' || label === 'CV') return t('sidebar.menu_cvs', 'Hồ sơ & CV');
    if (label === 'Quản lý ứng tuyển' || label === 'Ứng tuyển' || label === 'Hồ sơ ứng tuyển' || code === 'menu:applications') return t('sidebar.menu_applications', 'Hồ sơ ứng tuyển');
    if (label === 'Khu vực ứng viên' || label === 'Ứng viên' || code === 'menu:candidate') return t('sidebar.menu_candidate', 'Khu vực ứng viên');
    if (label === 'Lịch sử ứng tuyển' || code === 'menu:candidate-applications' || code === 'module:candidate-applications') return t('sidebar.menu_candidate_applications', 'Lịch sử ứng tuyển');
    if (label === 'Thư mời nhận việc' || label === 'Job Offers' || code === 'menu:candidate-offers' || code === 'module:candidate-offers') return t('sidebar.menu_candidate_offers', 'Thư mời nhận việc');
    if (label === 'Lịch phỏng vấn') return t('sidebar.menu_interviews', 'Lịch phỏng vấn');
    if (label === 'Trang doanh nghiệp' || label === 'Doanh nghiệp') return t('sidebar.menu_companies', 'Doanh nghiệp');
    if (label === 'Việc làm đã lưu' || label === 'Đã lưu' || code === 'menu:saved-jobs' || code === 'module:saved-jobs') return t('sidebar.menu_saved_jobs', 'Việc làm đã lưu');
    if (label === 'Tin nhắn & Trò chuyện' || label === 'Tin nhắn') return t('sidebar.menu_messages', 'Tin nhắn');
    if (label === 'Trung tâm thông báo' || label === 'Thông báo') return t('sidebar.menu_notifications', 'Thông báo');
    if (label === 'Báo cáo & Thống kê' || label === 'Báo cáo') return t('sidebar.menu_reports', 'Báo cáo & Thống kê');
    if (label === 'Cấu hình hệ thống' || label === 'Cấu hình') return t('sidebar.menu_system', 'Cấu hình hệ thống');
    if (label === 'Tài khoản') return t('sidebar.module_user', 'Tài khoản');
    if (label === 'Phân quyền') return t('sidebar.module_user_role', 'Phân quyền');
    if (label === 'Cấu hình chung' || label === 'Cấu hình hệ thống') return t('sidebar.module_system_setting', 'Cấu hình hệ thống');
    if (label === 'Danh mục dùng chung' || label === 'Danh mục') return t('sidebar.module_master_data', 'Danh mục dùng chung');
    if (label === 'Cơ cấu tổ chức' || label === 'Tổ chức') return t('sidebar.module_crm_organization', 'Cơ cấu tổ chức');
    
    return label;
  };

  const visibleMenuItems = filterMenuItems(menus);

  return (
    <aside className={`${styles.sidebar} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <img src={companyLogo} alt="Logo" className={styles.logoImg} />
          {expanded && <span className={styles.logoText}>{companyCode}</span>}
        </div>
        {expanded && (
          <button className={styles.toggleBtn} onClick={onToggle}>
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        {loading ? (
          <div className={styles.loading}>{t('sidebar.loading', 'Đang tải...')}</div>
        ) : (
          visibleMenuItems.map((item) => {
            // Chỉ menu to nào có nhiều hơn 1 menu con mới hiển thị mũi tên mở rộng (accordion).
            // Nếu chỉ có 1 hoặc 0 trang con, menu to hiển thị dạng link bấm trực tiếp, không cần mũi tên.
            const hasSubmenu = Boolean(item.children && item.children.length > 1);
            const directRoute = (item.children && item.children.length === 1 && item.children[0].route) 
              || item.route 
              || '#';

            const isChildActive = hasSubmenu && item.children?.some(
              (child) => child.route && (location.pathname === child.route || location.pathname.startsWith(child.route + '/'))
            );

            return (
              <div key={item.label} className={styles.group}>
                {hasSubmenu ? (
                  <>
                    <button 
                      className={`${styles.item} ${expandedSubmenus.has(item.label) ? styles.itemExpanded : ''} ${isChildActive ? styles.active : ''}`}
                      onClick={() => toggleSubmenu(item.label)}
                      title={item.label}
                    >
                      <Icon name={item.icon} size={20} className={styles.icon} />
                      {expanded ? (
                        <span className={styles.label}>{getTranslatedLabel(item.code, item.label)}</span>
                      ) : (
                        item.shortName && <span className={styles.shortName}>{getTranslatedLabel(item.shortName, item.shortName)}</span>
                      )}
                      {expanded && (
                        <div className={styles.arrow}>
                          {expandedSubmenus.has(item.label) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      )}
                    </button>
                    
                    {expanded && expandedSubmenus.has(item.label) && (
                      <div className={styles.submenu}>
                        {item.children!.map((child) => (
                          <NavLink 
                            key={child.label}
                            to={child.route || '#'}
                            className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                          >
                            <span className={styles.submenuDot}></span>
                            <span className={styles.submenuLabel}>{getTranslatedLabel(child.code, child.label)}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink 
                    to={directRoute}
                    className={({ isActive }) => {
                      const isRouteActive = isActive || (
                        (directRoute === '/employer/applications' || directRoute === '/applications') &&
                        (location.pathname === '/employer/applications' || location.pathname === '/applications' || location.pathname.startsWith('/employer/applications/') || location.pathname.startsWith('/applications/'))
                      );
                      return `${styles.item} ${isRouteActive ? styles.active : ''}`;
                    }}
                    title={item.label}
                  >
                    <Icon name={item.icon} size={20} className={styles.icon} />
                    {expanded ? (
                      <span className={styles.label}>{getTranslatedLabel(item.code, item.label)}</span>
                    ) : (
                      item.shortName && <span className={styles.shortName}>{getTranslatedLabel(item.shortName, item.shortName)}</span>
                    )}
                  </NavLink>
                )}
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
};
