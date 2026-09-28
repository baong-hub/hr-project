import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, X, LayoutDashboard, LogOut, ArrowRight } from 'lucide-react';
import { authService } from '../../core/services/auth.service';
import { metaService, type ProvinceItem, type IndustryItem, STATIC_PROVINCES, STATIC_INDUSTRIES } from '../../core/services/meta.service';
import styles from './PublicNavbar.module.scss';
import logoImg from '@/assets/logo.png';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileJobsAccordion, setMobileJobsAccordion] = useState(false);
  const [mobileSearchKeyword, setMobileSearchKeyword] = useState('');

  const [topIndustries, setTopIndustries] = useState<IndustryItem[]>(STATIC_INDUSTRIES.slice(0, 12));
  const [centralCities, setCentralCities] = useState<ProvinceItem[]>(
    STATIC_PROVINCES.filter((p) => p.type === 'city')
  );

  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const userRole = (user?.role || user?.accountType || '').toString().toUpperCase();
  const isEmployer =
    isAuthenticated &&
    (roles.includes('Nhà tuyển dụng') ||
      userRole === 'EMPLOYER' ||
      userRole === 'COMPANY_OWNER' ||
      userRole === 'HR_MANAGER' ||
      userRole === 'RECRUITER');

  const navigate = useNavigate();
  const location = useLocation();

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch top industries & central cities for mega-menu
  useEffect(() => {
    metaService.getIndustries().then((industries) => {
      if (industries && industries.length > 0) {
        // Sort by jobCount if available, otherwise take first 12
        const sorted = [...industries].sort((a, b) => (b.jobCount || 0) - (a.jobCount || 0));
        setTopIndustries(sorted.slice(0, 12));
      }
    });

    metaService.getProvinces().then((provinces) => {
      if (provinces && provinces.length > 0) {
        setCentralCities(provinces.filter((p) => p.type === 'city'));
      }
    });
  }, []);

  // Close menus on click outside or Esc key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setMegaMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMegaMenuOpen(false);
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMegaMenuOpen(false);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleDashboardClick = () => {
    setUserDropdownOpen(false);
    if (userRole === 'CANDIDATE' || userRole === 'USER') {
      navigate('/candidate/applications');
    } else if (isEmployer) {
      navigate('/employer/jobs');
    } else if (userRole === 'ADMIN' || userRole === 'SUPER ADMIN') {
      navigate('/user-roles');
    } else {
      navigate('/candidate/applications');
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await authService.logout();
    navigate('/', { replace: true });
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchKeyword.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(mobileSearchKeyword.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const displayName = user?.fullName || user?.username || user?.email || 'Tài khoản';

  return (
    <header className={styles.navbarWrapper}>
      {/* Row 1: Top Bar (36px, #1E2130) */}
      <div className={styles.topBar}>
        <div className={styles.topBarContainer}>
          <div className={styles.topBarLeft}>
            <span>Nền tảng kết nối việc làm và tuyển dụng chuyên nghiệp</span>
          </div>

          <div className={styles.topBarRight}>
            <Link to="/pricing" className={styles.topBarEmployerLink}>
              Dành cho nhà tuyển dụng <ChevronRight size={13} />
            </Link>
            <span className={styles.topBarDivider}>|</span>

            {!isAuthenticated ? (
              <>
                <Link to="/auth/login" className={styles.topBarLink}>
                  Đăng nhập
                </Link>
                <Link to="/auth/register/candidate" className={styles.topBarLink}>
                  Đăng ký
                </Link>
              </>
            ) : (
              <div className={styles.userMenuWrapper} ref={userMenuRef}>
                <button
                  type="button"
                  className={styles.userMenuTrigger}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                >
                  <span>{displayName}</span>
                  <ChevronDown size={13} />
                </button>

                {userDropdownOpen && (
                  <div className={styles.userDropdown} role="menu">
                    <button
                      type="button"
                      className={styles.userDropdownItem}
                      onClick={handleDashboardClick}
                      role="menuitem"
                    >
                      <LayoutDashboard size={14} /> Vào trang quản lý
                    </button>
                    <button
                      type="button"
                      className={`${styles.userDropdownItem} ${styles.danger}`}
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <LogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Main Navigation Bar (60px, White) */}
      <div className={styles.mainBar}>
        <div className={styles.mainContainer}>
          <div className={styles.brandGroup}>
            <Link to="/" className={styles.logoLink} aria-label="HR Portal - Trang chủ">
              <img src={logoImg} alt="HR Portal Logo" className={styles.logoImg} />
            </Link>

            <nav className={styles.navMenu} aria-label="Menu chính">
              {/* Mega Menu Trigger: Việc làm */}
              <div className={styles.navItem} ref={megaMenuRef}>
                <button
                  type="button"
                  className={`${styles.megaTrigger} ${isActive('/jobs') ? styles.active : ''}`}
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  aria-expanded={megaMenuOpen}
                  aria-haspopup="true"
                >
                  Việc làm <ChevronDown size={14} />
                </button>

                {megaMenuOpen && (
                  <div className={styles.megaMenu} role="region" aria-label="Mega menu việc làm">
                    {/* Column 1: Theo ngành nghề */}
                    <div>
                      <div className={styles.megaColTitle}>Theo ngành nghề</div>
                      <ul className={styles.megaColList}>
                        {topIndustries.map((ind) => (
                          <li key={ind.code}>
                            <Link
                              to={`/jobs?industry=${encodeURIComponent(ind.code)}`}
                              className={styles.megaLink}
                              onClick={() => setMegaMenuOpen(false)}
                            >
                              <span>{ind.name}</span>
                              {ind.jobCount !== undefined && ind.jobCount > 0 && (
                                <span className={styles.megaCount}>{ind.jobCount}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/jobs"
                        className={styles.megaViewAll}
                        onClick={() => setMegaMenuOpen(false)}
                      >
                        Xem tất cả 36 ngành <ArrowRight size={13} />
                      </Link>
                    </div>

                    {/* Column 2: Theo địa điểm */}
                    <div>
                      <div className={styles.megaColTitle}>Theo địa điểm</div>
                      <ul className={styles.megaColList}>
                        {centralCities.map((city) => (
                          <li key={city.code}>
                            <Link
                              to={`/jobs?province=${encodeURIComponent(city.code)}`}
                              className={styles.megaLink}
                              onClick={() => setMegaMenuOpen(false)}
                            >
                              <span>{city.name}</span>
                              {city.jobCount !== undefined && city.jobCount > 0 && (
                                <span className={styles.megaCount}>{city.jobCount}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/jobs"
                        className={styles.megaViewAll}
                        onClick={() => setMegaMenuOpen(false)}
                      >
                        Tất cả 34 tỉnh, thành <ArrowRight size={13} />
                      </Link>
                    </div>

                    {/* Column 3: Theo hình thức làm việc */}
                    <div>
                      <div className={styles.megaColTitle}>Theo hình thức</div>
                      <ul className={styles.megaColList}>
                        <li>
                          <Link
                            to="/jobs?type=Full-time"
                            className={styles.megaLink}
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            <span>Toàn thời gian</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/jobs?type=Part-time"
                            className={styles.megaLink}
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            <span>Bán thời gian</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/jobs?type=Internship"
                            className={styles.megaLink}
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            <span>Thực tập sinh</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/jobs?mode=remote"
                            className={styles.megaLink}
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            <span>Làm việc từ xa (Remote)</span>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/companies"
                className={`${styles.navLink} ${isActive('/companies') ? styles.active : ''}`}
              >
                Công ty
              </Link>
              <Link
                to="/blog"
                className={`${styles.navLink} ${isActive('/blog') ? styles.active : ''}`}
              >
                Cẩm nang
              </Link>
              <Link
                to="/salary-insights"
                className={`${styles.navLink} ${isActive('/salary-insights') ? styles.active : ''}`}
              >
                Báo cáo lương
              </Link>
            </nav>
          </div>

          <div className={styles.mainActions}>
            <Link
              to={isEmployer ? '/employer/jobs/new' : '/auth/register/employer'}
              className={styles.postJobBtn}
            >
              Đăng tin tuyển dụng
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={styles.mobileToggleBtn}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở menu di động"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Full Height Panel) */}
      {mobileMenuOpen && (
        <>
          <div
            className={styles.mobileBackdrop}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="Menu điều hướng">
            <div className={styles.mobileDrawerHeader}>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <img src={logoImg} alt="HR Portal Logo" className={styles.logoImg} />
              </Link>
              <button
                type="button"
                className={styles.mobileToggleBtn}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Search Box */}
            <form onSubmit={handleMobileSearch} className={styles.mobileSearchBox}>
              <input
                type="text"
                placeholder="Tìm việc làm, kỹ năng..."
                value={mobileSearchKeyword}
                onChange={(e) => setMobileSearchKeyword(e.target.value)}
              />
            </form>

            <nav className={styles.mobileNavList}>
              {/* Accordion: Việc làm */}
              <div>
                <button
                  type="button"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileJobsAccordion(!mobileJobsAccordion)}
                  aria-expanded={mobileJobsAccordion}
                >
                  <span>Việc làm</span>
                  <ChevronDown
                    size={16}
                    className={`${styles.accordionChevron} ${mobileJobsAccordion ? styles.open : ''}`}
                  />
                </button>
                {mobileJobsAccordion && (
                  <div className={styles.mobileAccordionContent}>
                    <Link
                      to="/jobs"
                      className={styles.mobileSubLink}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Tất cả việc làm
                    </Link>
                    <Link
                      to="/jobs?mode=remote"
                      className={styles.mobileSubLink}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Việc làm từ xa
                    </Link>
                    <Link
                      to="/jobs?type=Full-time"
                      className={styles.mobileSubLink}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Toàn thời gian
                    </Link>
                    <Link
                      to="/jobs?type=Internship"
                      className={styles.mobileSubLink}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Thực tập sinh
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to="/companies"
                className={`${styles.mobileNavLink} ${isActive('/companies') ? styles.mobileActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Công ty
              </Link>
              <Link
                to="/blog"
                className={`${styles.mobileNavLink} ${isActive('/blog') ? styles.mobileActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Cẩm nang
              </Link>
              <Link
                to="/salary-insights"
                className={`${styles.mobileNavLink} ${isActive('/salary-insights') ? styles.mobileActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Báo cáo lương
              </Link>
              <Link
                to="/pricing"
                className={`${styles.mobileNavLink} ${isActive('/pricing') ? styles.mobileActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Bảng giá dịch vụ
              </Link>
            </nav>

            <div className={styles.mobileDivider} />

            <div className={styles.mobileFooterActions}>
              <Link
                to={isEmployer ? '/employer/jobs/new' : '/auth/register/employer'}
                className={styles.postJobBtn}
                onClick={() => setMobileMenuOpen(false)}
              >
                Đăng tin tuyển dụng
              </Link>

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/auth/login"
                    className={styles.mobileNavLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/auth/register/candidate"
                    className={styles.mobileNavLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng ký ứng viên
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.mobileNavLink}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleDashboardClick();
                    }}
                  >
                    Vào trang quản lý
                  </button>
                  <button
                    type="button"
                    className={`${styles.mobileNavLink} ${styles.danger}`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Đăng xuất
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
