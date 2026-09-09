import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  Moon,
  Globe,
  DollarSign,
  Bell,
  FileText,
  Package,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Sidebar } from '../Sidebar/Sidebar';
import { authService } from '../../services/auth.service';
import { profileService } from '../../services/profile.service';
import { notificationService } from '../../services/notification.service';
import { notificationSignalRService } from '../../services/signalrNotification.service';
import { presenceSignalRService } from '../../services/presenceSignalR.service';
import { AiChatWidget } from '../../../shared/ui/AiChatWidget/AiChatWidget';
import styles from './AppShell.module.scss';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => authService.getUser());
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = () => {
    notificationService.getUnreadCount().then(res => {
      if (res.data?.success && res.data.data) {
        setUnreadCount(res.data.data.count || 0);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    const syncUser = () => {
      const u = authService.getUser();
      setCurrentUser(u);
      if (u?.id) {
        notificationSignalRService.startConnection(u.id);
        presenceSignalRService.startConnection(u.id);
      }
    };
    window.addEventListener('app-auth-changed', syncUser);

    const onNotificationReceived = () => {
      setUnreadCount(prev => prev + 1);
    };
    window.addEventListener('app-notification-received', onNotificationReceived);

    const user = authService.getUser();
    if (user?.id) {
      notificationSignalRService.startConnection(user.id);
      presenceSignalRService.startConnection(user.id);
      fetchUnreadCount();
    }

    // Fetch latest profile from API to guarantee full name and avatar are synced
    profileService.getProfile().then(res => {
      if (res.success && res.data) {
        const stored = authService.getUser() || {};
        const updated = {
          ...stored,
          fullName: res.data.fullName,
          avatarUrl: res.data.avatarUrl,
          email: res.data.email || stored.email
        };
        localStorage.setItem('user', JSON.stringify(updated));
        setCurrentUser(updated);
      }
    }).catch(() => {});

    return () => {
      window.removeEventListener('app-auth-changed', syncUser);
      window.removeEventListener('app-notification-received', onNotificationReceived);
    };
  }, []);

  const displayName = currentUser?.fullName || currentUser?.companyName || currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Người dùng');
  const avatarUrl = currentUser?.avatarUrl || currentUser?.companyLogoUrl || currentUser?.logo;
  const roleName = currentUser?.companyName || (currentUser?.roles?.includes('Ứng viên') ? 'Ứng viên' : (currentUser?.roles?.includes('Nhà tuyển dụng') ? 'Nhà tuyển dụng' : currentUser?.role));

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'U';

  const handleLogout = async () => {
    await authService.logout();
    navigate('/auth/login', { replace: true });
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
              <button className={styles.iconBtn} title="Notifications" onClick={() => navigate('/notifications')}>
                <div className={styles.badgeWrapper}>
                  <Bell size={18} />
                  {unreadCount > 0 && <span className={styles.redBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
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
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatarInitials}>{initials}</span>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{displayName}</span>
                  {roleName && <span className={styles.userRole}>{roleName}</span>}
                </div>
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

      {/* Floating AI Chat Assistant */}
      <AiChatWidget />
    </div>
  );
};
