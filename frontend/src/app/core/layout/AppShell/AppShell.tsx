import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  Moon,
  Globe,
  DollarSign,
  Bell,
  FileText,
  Package,
  User,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Sidebar } from '../Sidebar/Sidebar';
import { authService } from '../../services/auth.service';
import styles from './AppShell.module.scss';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className={styles.appShell}>
      {/* Sidebar Layout */}
      <Sidebar expanded={!collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Area */}
      <div className={`${styles.mainContainer} ${!collapsed ? styles.expanded : ''}`}>
        {/* Header Layout */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={styles.hamburgerBtn}
            >
              <Menu size={20} />
            </button>
            <div className={styles.siteSelector}>
              <MapPin size={16} className={styles.pinIcon} />
              <span>Default Site</span>
              <ChevronRight size={12} className={styles.dropdownArrow} />
            </div>
          </div>

          {/* Header Right Widgets */}
          <div className={styles.headerRight}>
            {/* Utility icons row matching the CRM screenshot */}
            <div className={styles.iconsRow}>
              <button className={styles.iconBtn} title="Dark Mode">
                <Moon size={18} />
              </button>
              <button className={styles.iconBtn} title="Language">
                <Globe size={18} />
                <span className={styles.langText}>VI</span>
              </button>
              <button className={styles.iconBtn} title="Notifications">
                <div className={styles.badgeWrapper}>
                  <Bell size={18} />
                  <span className={styles.redBadge}>15</span>
                </div>
              </button>
              <button className={styles.iconBtn} title="Billing">
                <DollarSign size={18} />
              </button>
              <button className={styles.iconBtn} title="Documents">
                <div className={styles.badgeWrapper}>
                  <FileText size={18} />
                  <span className={styles.greenBadge}>134</span>
                </div>
              </button>
              <button className={styles.iconBtn} title="Packages">
                <div className={styles.badgeWrapper}>
                  <Package size={18} />
                  <span className={styles.redBadge}>6</span>
                </div>
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className={styles.profileWidget}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={styles.profileBtn}
              >
                <div className={styles.avatar}>
                  <User size={16} />
                </div>
                <span>{authService.getUser()?.fullName || 'Người dùng'}</span>
                <ChevronRight size={12} className={styles.dropdownArrow} />
              </button>
              {showProfileDropdown && (
                <div className={styles.dropdownMenu}>
                  <button onClick={() => navigate('/profile')}>Thông tin cá nhân</button>
                  <button onClick={handleLogout}>Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Workspace */}
        <main className={styles.workspace}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
