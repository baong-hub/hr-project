import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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

  const hasPermission = (code?: string, route?: string) => {
    // 1. Ẩn hoàn toàn "Việc làm đã lưu" đối với Admin và Nhà tuyển dụng (chỉ dành riêng cho Ứng viên)
    if (isSuperAdmin || isEmployer || !isCandidate) {
      if (
        code === 'menu:saved-jobs' || 
        code === 'module:saved-jobs' || 
        code === 'job:save' ||
        code === 'saved-jobs:view' ||
        route === '/candidate/saved-jobs' || 
        route === '/saved-jobs' || 
        route?.includes('/saved-jobs')
      ) {
        return false;
      }
    }

    if (isSuperAdmin) return true;
    if (!code && !route) return true;

    // 2. Ẩn trang/menu Quản lý ứng tuyển đối với ứng viên (chỉ dành cho Nhà tuyển dụng/Admin)
    if (isCandidate && (
      code === 'menu:applications' || 
      code === 'module:applications' || 
      route === '/applications' || 
      route?.includes('/applications')
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
      const candidateAllowed = ['menu:jobs', 'menu:cvs', 'menu:interviews', 'menu:companies', 'menu:saved-jobs', 'menu:messages', 'menu:notifications'];
      if (code && candidateAllowed.includes(code)) return true;
    }

    // Employer defaults
    if (isEmployer) {
      const employerAllowed = ['menu:jobs', 'menu:cvs', 'menu:applications', 'menu:interviews', 'menu:companies', 'menu:messages', 'menu:notifications'];
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
          setMenus(mapped);
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
        // Ẩn menu việc làm đã lưu đối với Admin và Nhà tuyển dụng (chỉ dành riêng cho ứng viên)
        if (isSuperAdmin || isEmployer || !isCandidate) {
          if (
            item.code === 'menu:saved-jobs' ||
            item.code === 'module:saved-jobs' ||
            item.route === '/candidate/saved-jobs' ||
            item.route === '/saved-jobs' ||
            item.label?.toLowerCase().includes('đã lưu') ||
            item.shortName?.toLowerCase().includes('đã lưu')
          ) {
            return null;
          }
        }

        // Ẩn menu ứng tuyển hoàn toàn đối với tài khoản ứng viên
        if (isCandidate && (
          item.code === 'menu:applications' ||
          item.code === 'module:applications' ||
          item.route === '/applications' ||
          item.label === 'Quản lý ứng tuyển' ||
          item.shortName === 'Ứng tuyển'
        )) {
          return null;
        }

        if (item.children && item.children.length > 0) {
          const visibleChildren = item.children.filter((child) => {
            if (isSuperAdmin || isEmployer || !isCandidate) {
              if (
                child.code === 'menu:saved-jobs' ||
                child.code === 'module:saved-jobs' ||
                child.route === '/candidate/saved-jobs' ||
                child.route === '/saved-jobs' ||
                child.label?.toLowerCase().includes('đã lưu') ||
                child.shortName?.toLowerCase().includes('đã lưu')
              ) return false;
            }

            if (isCandidate && (child.code === 'menu:applications' || child.route === '/applications')) return false;
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
    if (label === 'Quản lý ứng tuyển' || label === 'Ứng tuyển') return t('sidebar.menu_applications', 'Ứng tuyển');
    if (label === 'Lịch phỏng vấn') return t('sidebar.menu_interviews', 'Lịch phỏng vấn');
    if (label === 'Trang doanh nghiệp' || label === 'Doanh nghiệp') return t('sidebar.menu_companies', 'Doanh nghiệp');
    if (label === 'Việc làm đã lưu' || label === 'Đã lưu') return t('sidebar.menu_saved_jobs', 'Việc làm đã lưu');
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
          visibleMenuItems.map((item) => (
            <div key={item.label} className={styles.group}>
            {item.children && item.children.length > 0 ? (
              <>
                <button 
                  className={`${styles.item} ${expandedSubmenus.has(item.label) ? styles.itemExpanded : ''}`}
                  onClick={() => toggleSubmenu(item.label)}
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
                    {item.children.map((child) => (
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
                to={item.route || '#'}
                className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
              >
                <Icon name={item.icon} size={20} className={styles.icon} />
                {expanded ? (
                  <span className={styles.label}>{getTranslatedLabel(item.code, item.label)}</span>
                ) : (
                  item.shortName && <span className={styles.shortName}>{getTranslatedLabel(item.shortName, item.label)}</span>
                )}
              </NavLink>
            )}
          </div>
        ))
      )}
      </nav>
    </aside>
  );
};
