import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Building, DollarSign, Menu, X, LogIn, UserPlus, Sparkles, LogOut } from 'lucide-react';
import { authService } from '../../core/services/auth.service';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDashboardClick = () => {
    const role = (user?.role || user?.accountType || '').toString().toUpperCase();
    if (role === 'CANDIDATE' || role === 'USER') {
      navigate('/candidate/applications');
    } else if (
      role === 'EMPLOYER' ||
      role === 'COMPANY_OWNER' ||
      role === 'HR_MANAGER' ||
      role === 'RECRUITER' ||
      role === 'HIRING_MANAGER'
    ) {
      navigate('/employer/jobs');
    } else if (role === 'ADMIN' || role === 'SUPER ADMIN') {
      navigate('/user-roles');
    } else {
      navigate('/candidate/applications');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/', { replace: true });
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const linkStyle = (path: string): React.CSSProperties => {
    const active = isActive(path);
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: active ? '#2563eb' : '#475569',
      textDecoration: 'none',
      fontWeight: active ? 600 : 500,
      fontSize: '0.95rem',
      padding: '8px 12px',
      borderRadius: '8px',
      backgroundColor: active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
      transition: 'all 0.2s ease'
    };
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 20px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/hr.png" alt="HR Portal Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.5px' }}>
              HR <span style={{ color: '#2563eb' }}>Portal</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: 500, lineHeight: 1 }}>
              TUYỂN DỤNG & NHÂN SỰ
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden-mobile">
          <Link to="/jobs" style={linkStyle('/jobs')}>
            <Briefcase size={17} color={isActive('/jobs') ? '#2563eb' : '#3b82f6'} />
            Việc làm
          </Link>
          <Link to="/companies" style={linkStyle('/companies')}>
            <Building size={17} color={isActive('/companies') ? '#059669' : '#10b981'} />
            Công ty
          </Link>
          <Link to="/pricing" style={linkStyle('/pricing')}>
            <DollarSign size={17} color={isActive('/pricing') ? '#d97706' : '#f59e0b'} />
            Bảng giá
          </Link>
          <Link to="/about" style={linkStyle('/about')}>
            Giới thiệu
          </Link>
          <Link to="/contact" style={linkStyle('/contact')}>
            Liên hệ
          </Link>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="hidden-mobile">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleDashboardClick}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Sparkles size={16} />
                Trang Quản Trị ({user?.fullName?.split(' ').slice(-1)[0] || 'Tài khoản'})
              </button>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/auth/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#1e293b',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogIn size={16} color="#2563eb" />
                Đăng nhập
              </Link>
              <Link
                to="/auth/register/candidate"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
              >
                <UserPlus size={16} />
                Đăng ký
              </Link>
              <Link
                to="/auth/register/employer"
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  border: '1px solid #94a3b8',
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Đăng tin tuyển dụng
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', display: 'none' }}
          className="visible-mobile"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '16px 20px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} style={linkStyle('/jobs')}>
            <Briefcase size={17} color="#2563eb" /> Việc làm
          </Link>
          <Link to="/companies" onClick={() => setMobileMenuOpen(false)} style={linkStyle('/companies')}>
            <Building size={17} color="#059669" /> Công ty
          </Link>
          <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} style={linkStyle('/pricing')}>
            <DollarSign size={17} color="#d97706" /> Bảng giá dịch vụ
          </Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={linkStyle('/about')}>
            Giới thiệu
          </Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={linkStyle('/contact')}>
            Liên hệ
          </Link>
          
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleDashboardClick(); }}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} />
                  Vào Trang Quản Trị ({user?.fullName || 'Tài khoản'})
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textAlign: 'center', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/auth/register/candidate"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textAlign: 'center', padding: '10px', backgroundColor: '#2563eb', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}
                >
                  Đăng ký Ứng viên
                </Link>
                <Link
                  to="/auth/register/employer"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f1f5f9', color: '#0f172a', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}
                >
                  Đăng ký Nhà tuyển dụng
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
