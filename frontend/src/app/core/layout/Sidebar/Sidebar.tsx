import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SidebarItem } from '../../config/sidebarMenu.config';
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
  const isSuperAdmin = roles.includes('Super Admin') || roles.includes('super_admin') || user?.username === 'admin';
  const hasPermission = (perm: string) => {
    if (isSuperAdmin) return true;
    if (!perm) return true;
    if (permissions.includes(perm)) return true;
    // Menu báo cáo tổng hợp: cần check quyền logactivity:view cụ thể
    if (perm === 'menu:logactivities') {
      return permissions.includes('logactivity:view');
    }
    // Module giám sát cuộc gọi: cần check quyền callcenter:supervisor
    if (perm === 'module:callcenter-monitor') {
      return permissions.includes('callcenter:supervisor');
    }
    if (perm.startsWith('module:') || perm.startsWith('menu:')) return true;
    const cleanCode = perm.replace(/^module:|^menu:/, '');
    return permissions.some(p => p === cleanCode || p.startsWith(cleanCode + ':') || p.startsWith(cleanCode + '_'));
  };

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await authService.getAuthorizedMenus();
        if (response.success) {
          // Map backend MenuDto to SidebarItem, filtering out removed KPI report and Chi nhánh modules
          const filterKpi = (item: any) => 
            item.route !== '/callcenter/kpi' && 
            item.code !== 'module:callcenter-kpi' && 
            item.code !== 'callcenter:kpi' && 
            item.name !== 'Báo cáo KPI' &&
            item.label !== 'Báo cáo KPI' &&
            item.route !== '/sites' &&
            item.code !== 'module:site' &&
            item.name !== 'Chi nhánh' &&
            item.label !== 'Chi nhánh' &&
            item.label !== 'Sites / Branches' &&
            item.route !== '/callcenter/settings' &&
            item.code !== 'module:callcenter-setting' &&
            item.name !== 'Cấu hình tổng đài' &&
            item.label !== 'Cấu hình tổng đài';

          const mapMenu = (m: any): SidebarItem => ({
            label: m.name || m.label,
            shortName: m.shortName,
            icon: m.icon || 'Menu',
            route: m.route,
            code: m.code,
            children: m.children && m.children.length > 0 
              ? m.children.filter(filterKpi).map(mapMenu) 
              : undefined
          });
          const mapped = response.data.filter(filterKpi).map(mapMenu);


          setMenus(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch sidebar menus:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const filterMenuItems = (items: SidebarItem[]): SidebarItem[] => {
    if (isSuperAdmin) return items;

    return items
      .map((item) => {
        if (item.children && item.children.length > 0) {
          const visibleChildren = item.children.filter((child) => {
            if (!child.code) return true;
            return hasPermission(child.code);
          });
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        } else {
          if (item.code && !hasPermission(item.code)) return null;
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
    
    // Fallback dịch theo tên nhãn gốc Tiếng Việt hoặc Tiếng Anh
    if (label === 'CRM & LEADS' || label === 'CRM & Quản lý Leads' || label === 'CRM') return t('sidebar.menu_crm');
    if (label === 'Cơ hội (Leads)' || label === 'Leads & Opportunities') return t('sidebar.module_crm_lead');
    if (label === 'Quản lý công việc' || label === 'Task Management') return t('sidebar.module_crm_task');
    if (label === 'Cơ cấu tổ chức' || label === 'Organization Structure') return t('sidebar.module_crm_organization');
    if (label === 'Phân loại công việc' || label === 'Task Categories') return t('sidebar.module_crm_task_type');
    if (label === 'Landing Page Forms') return t('sidebar.module_crm_public_form');
    if (label === 'Báo cáo CRM' || label === 'CRM Reports') return t('sidebar.module_crm_report');

    if (label === 'SYSTEM SETTINGS' || label === 'Cấu hình hệ thống') return t('sidebar.menu_system');
    if (label === 'Accounts List' || label === 'Tài khoản') return t('sidebar.module_user');
    if (label === 'Roles & Permissions' || label === 'Phân quyền') return t('sidebar.module_user_role');
    if (label === 'Sites / Branches' || label === 'Chi nhánh') return t('sidebar.module_site');
    if (label === 'Common Catalogs' || label === 'Danh mục dùng chung') return t('sidebar.module_master_data');
    if (label === 'Tham số hệ thống' || label === 'Cài đặt hệ thống' || label === 'System Settings') return t('sidebar.system_setting_update');

    if (label === 'CALL CENTER' || label === 'Call Center') return t('sidebar.menu_callcenter');
    if (label === 'Lịch sử cuộc gọi' || label === 'Call History') return t('sidebar.callcenter_history');
    if (label === 'Chỉ tiêu KPI' || label === 'KPI Targets') return t('sidebar.callcenter_kpi');
    if (label === 'Giám sát cuộc gọi' || label === 'Call Supervisor') return t('sidebar.callcenter_monitor');
    if (label === 'Cấu hình tổng đài' || label === 'CallCenter Settings') return t('sidebar.callcenter_settings');
    if (label === 'Giả lập cuộc gọi' || label === 'Call Simulator') return t('sidebar.callcenter_simulator');

    if (label === 'BÁO CÁO TỔNG HỢP' || label === 'Báo cáo Tổng hợp' || label === 'Activity Logs & Reports') return t('sidebar.menu_logactivities');

    if (label === 'Quản lý khách hàng') return t('sidebar.menu_customer');
    if (label === 'Khách hàng') return t('sidebar.module_customer');
    if (label === 'Lịch hẹn') return t('sidebar.menu_appointment');
    if (label === 'Quản lý hóa đơn') return t('sidebar.menu_bill');
    if (label === 'Quản lý đặt cọc') return t('sidebar.module_deposit');
    if (label === 'Sổ công nợ') return t('sidebar.module_ar_ledger');
    if (label === 'Yêu cầu hoàn hủy') return t('sidebar.module_refund');
    if (label === 'Quản lý nhân sự') return t('sidebar.menu_staff');
    if (label === 'Danh mục vị trí') return t('sidebar.module_position');
    if (label === 'Gán vị trí nhân viên') return t('sidebar.module_staff_position');
    if (label === 'Báo cáo') return t('sidebar.menu_report');
    if (label === 'Thực hiện DV') return t('sidebar.menu_service_execution');
    if (label === 'Quản lý kho') return t('sidebar.menu_inventory');
    if (label === 'Danh mục sản phẩm') return t('sidebar.menu_product');
    if (label === 'Sản phẩm & Dịch vụ') return t('sidebar.module_product');
    if (label === 'Danh mục & Nhãn') return t('sidebar.module_product_taxonomy');

    if (label === 'Doanh thu & Doanh số') return t('sidebar.group_revenue');
    if (label === 'Kho & Vật tư') return t('sidebar.group_inventory');
    if (label === 'Công nợ & Tài chính') return t('sidebar.group_finance');
    if (label === 'Phân quyền & Quản trị') return t('sidebar.group_admin');

    if (label === 'Báo cáo Nhập-Xuất-Tồn') return t('sidebar.report_nxt');
    if (label === 'Thẻ Kho') return t('sidebar.report_stock_card');
    if (label === 'Nhật ký nhập xuất chi tiết') return t('sidebar.report_detailed_journal');
    if (label === 'Sổ cái công nợ phải thu') return t('sidebar.report_ar_ledger');
    if (label === 'Báo cáo phân tích tuổi nợ') return t('sidebar.report_aging');
    
    return label;
  };

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
          <div className={styles.loading}>{t('sidebar.loading')}</div>
        ) : (
          filterMenuItems(menus).map((item) => (
            <div key={item.label} className={styles.group}>
            {item.children ? (
              <>
                <button 
                  className={`${styles.item} ${expandedSubmenus.has(item.label) ? styles.itemExpanded : ''}`}
                  onClick={() => toggleSubmenu(item.label)}
                >
                  <Icon name={item.icon} size={24} className={styles.icon} />
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
                    {item.code === 'menu:report' ? (
                      <>
                        {/* Nhóm 1: Doanh thu & Doanh số */}
                        {item.children.some(c => c.code !== 'module:report-permission-by-role' && c.code !== 'module:report-permission-by-user' && c.code !== 'module:report-consumable-by-service') && (
                          <>
                            <div className={styles.submenuGroupHeader}>{getTranslatedLabel(undefined, 'Doanh thu & Doanh số')}</div>
                            {item.children
                              .filter(c => c.code !== 'module:report-permission-by-role' && c.code !== 'module:report-permission-by-user' && c.code !== 'module:report-consumable-by-service')
                              .map((child) => (
                                <NavLink 
                                  key={child.label}
                                  to={child.route || '#'}
                                  className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                                >
                                  <span className={styles.submenuDot}></span>
                                  <span className={styles.submenuLabel}>{getTranslatedLabel(child.code, child.label)}</span>
                                </NavLink>
                              ))}
                          </>
                        )}

                        {/* Nhóm 2: Kho & Vật tư */}
                        {((hasPermission('inventory:view') || hasPermission('module:inventory') || item.children.some(c => c.code === 'module:report-consumable-by-service')) && (
                          <>
                            <div className={styles.submenuGroupHeader} style={{ marginTop: '8px' }}>{getTranslatedLabel(undefined, 'Kho & Vật tư')}</div>
                            {(hasPermission('inventory:view') || hasPermission('module:inventory')) && (
                              <>
                                <NavLink 
                                  to="/inventory/reports?tab=NXT"
                                  className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                                >
                                  <span className={styles.submenuDot}></span>
                                  <span className={styles.submenuLabel}>{getTranslatedLabel(undefined, 'Báo cáo Nhập-Xuất-Tồn')}</span>
                                </NavLink>
                                <NavLink 
                                  to="/inventory/reports?tab=STOCK_CARD"
                                  className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                                >
                                  <span className={styles.submenuDot}></span>
                                  <span className={styles.submenuLabel}>{getTranslatedLabel(undefined, 'Thẻ Kho')}</span>
                                </NavLink>
                                <NavLink 
                                  to="/inventory/reports?tab=DETAILED"
                                  className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                                >
                                  <span className={styles.submenuDot}></span>
                                  <span className={styles.submenuLabel}>{getTranslatedLabel(undefined, 'Nhật ký nhập xuất chi tiết')}</span>
                                </NavLink>
                              </>
                            )}
                            {item.children
                              .filter(c => c.code === 'module:report-consumable-by-service')
                              .map((child) => (
                                <NavLink 
                                  key={child.label}
                                  to={child.route || '#'}
                                  className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                                >
                                  <span className={styles.submenuDot}></span>
                                  <span className={styles.submenuLabel}>{getTranslatedLabel(child.code, child.label)}</span>
                                </NavLink>
                              ))}
                          </>
                        ))}

                        {/* Nhóm 3: Công nợ & Tài chính */}
                        {(hasPermission('ar:view') || hasPermission('module:ar-ledger') || hasPermission('ar_ledger:view')) && (
                          <>
                            <div className={styles.submenuGroupHeader} style={{ marginTop: '8px' }}>{getTranslatedLabel(undefined, 'Công nợ & Tài chính')}</div>
                            <NavLink 
                               to="/ar/ledger"
                               className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                            >
                              <span className={styles.submenuDot}></span>
                              <span className={styles.submenuLabel}>{getTranslatedLabel(undefined, 'Sổ cái công nợ phải thu')}</span>
                            </NavLink>
                            <NavLink 
                              to="/ar/aging-report"
                              className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                            >
                              <span className={styles.submenuDot}></span>
                              <span className={styles.submenuLabel}>{getTranslatedLabel(undefined, 'Báo cáo phân tích tuổi nợ')}</span>
                            </NavLink>
                          </>
                        )}

                        {/* Nhóm 4: Phân quyền & Quản trị */}
                        {item.children.some(c => c.code === 'module:report-permission-by-role' || c.code === 'module:report-permission-by-user') && (
                          <>
                            <div className={styles.submenuGroupHeader} style={{ marginTop: '8px' }}>{getTranslatedLabel(undefined, 'Phân quyền & Quản trị')}</div>
                            {item.children
                              .filter(c => c.code === 'module:report-permission-by-role' || c.code === 'module:report-permission-by-user')
                              .map((child) => (
                                <NavLink 
                                  key={child.label}
                                  to={child.route || '#'}
                                  className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                                >
                                  <span className={styles.submenuDot}></span>
                                  <span className={styles.submenuLabel}>{getTranslatedLabel(child.code, child.label)}</span>
                                </NavLink>
                              ))}
                          </>
                        )}
                      </>
                    ) : (
                      item.children.map((child) => (
                        <NavLink 
                          key={child.label}
                          to={child.route || '#'}
                          className={({ isActive }) => `${styles.submenuItem} ${isActive ? styles.submenuActive : ''}`}
                        >
                          <span className={styles.submenuDot}></span>
                          <span className={styles.submenuLabel}>{getTranslatedLabel(child.code, child.label)}</span>
                        </NavLink>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <NavLink 
                to={item.route || '#'}
                className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
              >
                <Icon name={item.icon} size={24} className={styles.icon} />
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
