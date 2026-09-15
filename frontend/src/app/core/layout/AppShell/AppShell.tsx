import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  MapPin,
  ChevronRight,
  MessageSquare,
  Bookmark,
  Users
} from 'lucide-react';
import { Sidebar } from '../Sidebar/Sidebar';
import { authService } from '../../services/auth.service';
import { profileService } from '../../services/profile.service';
import { ThemeToggle } from '../../../features/user-settings/components/ThemeToggle/ThemeToggle';
import { LanguageSelector } from '../../../features/user-settings/components/LanguageSelector/LanguageSelector';
import { NotificationBell } from '../../../features/notifications/components/NotificationBell/NotificationBell';
import { AiChatWidget } from '../../../shared/ui/AiChatWidget/AiChatWidget';
import styles from './AppShell.module.scss';

export const AppShell: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => authService.getUser());

  useEffect(() => {
    const syncUser = () => {
      const u = authService.getUser();
      setCurrentUser(u);
    };
    window.addEventListener('app-auth-changed', syncUser);

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
    };
  }, []);

  const displayName = currentUser?.fullName || currentUser?.companyName || currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Người dùng');
  const avatarUrl = currentUser?.avatarUrl || currentUser?.companyLogoUrl || currentUser?.logo;
  const roles = (currentUser?.roles as string[]) || [];
  const userRole = (currentUser?.role || currentUser?.accountType || '').toString().toUpperCase();
  const isCandidate = roles.includes('Ứng viên') || userRole === 'CANDIDATE' || userRole === 'USER';
  const roleName = currentUser?.companyName || (isCandidate ? (t('user.role', 'Ứng viên') === 'Role' ? 'Candidate' : 'Ứng viên') : (roles.includes('Nhà tuyển dụng') ? 'Nhà tuyển dụng' : currentUser?.role));

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
              title="Menu"
            >
              <Menu size={20} />
            </button>
            <div className={styles.siteSelector}>
              <MapPin size={16} className={styles.pinIcon} />
              <span>{t('header.default_site', 'Default Site')}</span>
              <ChevronRight size={12} className={styles.dropdownArrow} />
            </div>
          </div>

          {/* Header Right Widgets */}
          <div className={styles.headerRight}>
            {/* Real Interactive Tools & Actions */}
            <div className={styles.iconsRow}>
              {/* Theme Toggle (Dark / Light) */}
              <ThemeToggle />

              {/* Language Switcher (VI / EN) */}
              <LanguageSelector />

              {/* Realtime Notification Bell with Popover Dropdown */}
              <NotificationBell />

              {/* Messages & Chat Quick Link */}
              <button 
                className={styles.iconBtn} 
                title={t('sidebar.menu_messages', 'Tin nhắn & Trò chuyện')} 
                onClick={() => navigate('/messages')}
              >
                <MessageSquare size={18} />
              </button>

              {/* Context-aware Quick Shortcut */}
              {isCandidate ? (
                <button 
                  className={styles.iconBtn} 
                  title={t('sidebar.menu_saved_jobs', 'Việc làm đã lưu')} 
                  onClick={() => navigate('/saved-jobs')}
                >
                  <Bookmark size={18} />
                </button>
              ) : (
                <button 
                  className={styles.iconBtn} 
                  title={t('sidebar.menu_applications', 'Quản lý hồ sơ ứng tuyển')} 
                  onClick={() => navigate('/employer/applications')}
                >
                  <Users size={18} />
                </button>
              )}
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
                  <button onClick={() => navigate('/profile')}>{t('header.profile', 'Thông tin cá nhân')}</button>
                  <button onClick={handleLogout}>{t('header.logout', 'Đăng xuất')}</button>
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
