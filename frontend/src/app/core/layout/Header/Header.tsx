import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import { MapPin, Menu, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '../../../features/user-settings/components/ThemeToggle/ThemeToggle';
import { LanguageSelector } from '../../../features/user-settings/components/LanguageSelector/LanguageSelector';
import { NotificationBell } from '../../../features/notifications/components/NotificationBell/NotificationBell';
import { authService } from '../../services/auth.service';
import { masterDataService } from '../../services/master-data.service';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  sidebarExpanded: boolean;
  onToggle: () => void;
}

export const Header = ({ sidebarExpanded, onToggle }: HeaderProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = authService.getUser();
  const [sites, setSites] = useState<any[]>([]);
  const currentSiteId = authService.getWorkingSiteId();
  const { t } = useTranslation();

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const res = await masterDataService.getSites();
      let allSites = res.data.data || [];
      
      if (user?.allowedSites && user.allowedSites.length > 0) {
        allSites = allSites.filter((s: any) => user.allowedSites.includes(s.id));
      }
      
      setSites(allSites);
    } catch (err) {
      console.error('Failed to load sites', err);
    }
  };

  const handleSiteChange = (siteId: string) => {
    authService.setWorkingSiteId(siteId);
    window.location.reload();
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/auth/login', { replace: true });
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`${styles.header} ${sidebarExpanded ? styles.expanded : ''}`}>
      <div className={styles.header__left}>
        <button 
          className={styles.header__menuBtn} 
          onClick={onToggle} 
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
        
        {/* Site Switcher */}
        <div className={styles.header__siteSwitcher}>
          <MapPin size={16} className={styles.header__siteIcon} />
          <select 
            value={currentSiteId || ''} 
            onChange={(e) => handleSiteChange(e.target.value)}
            className={styles.header__siteSelect}
          >
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.header__right}>
        {/* Theme and Language toggles */}
        <ThemeToggle />
        <LanguageSelector />

        {/* Notifications (Bell + Dropdown) */}
        <NotificationBell />

        {/* User Menu */}
        <div className={styles.header__userMenu} ref={menuRef}>
          <button 
            className={styles.header__userInfo} 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <img 
              src={user?.avatarUrl || '/avatar-default.png'} 
              alt="Avatar" 
              className={styles.header__avatar} 
            />
            <div className={styles.header__userDetails}>
              <span className={styles.header__userName}>{user?.fullName || user?.username || 'User'}</span>
              <span className={styles.header__userRole}>{user?.accountType || 'Nhân viên'}</span>
            </div>
            <ChevronDown size={16} className={styles.header__chevron} />
          </button>

          {menuOpen && (
            <div className={styles.header__dropdown}>
              <button 
                onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                className={styles.header__dropdownItem}
              >
                Profile
              </button>
              <button 
                onClick={handleLogout}
                className={`${styles.header__dropdownItem} ${styles.header__dropdownItem_logout}`}
              >
                {t('common.logout', 'Đăng xuất')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
