import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Building, DollarSign, Menu, X, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { authService } from '../../core/services/auth.service';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    const role = user?.role || '';
    if (role === 'CANDIDATE') navigate('/jobs');
    else if (role === 'EMPLOYER' || role === 'COMPANY_OWNER' || role === 'HR_MANAGER' || role === 'RECRUITER') navigate('/employer/jobs');
    else if (role === 'ADMIN') navigate('/user-roles');
    else navigate('/jobs');
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
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hidden-mobile">
          <Link to="/jobs" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>
            <Briefcase size={17} color="#2563eb" />
            Việc làm
          </Link>
          <Link to="/companies" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>
            <Building size={17} color="#059669" />
            Công ty
          </Link>
          <Link to="/pricing" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>
            <DollarSign size={17} color="#d97706" />
            Bảng giá dịch vụ
          </Link>
          <Link to="/about" style={{ color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>
            Giới thiệu
          </Link>
          <Link to="/contact" style={{ color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>
            Liên hệ
          </Link>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="hidden-mobile">
          {isAuthenticated ? (
            <button
              onClick={handleDashboardClick}
              style={{
                backgroundColor: '#2563eb',
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
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
              }}
            >
              <Sparkles size={16} />
              Trang Quản Trị ({user?.fullName?.split(' ')[0] || 'Tài khoản'})
            </button>
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
                  padding: '8px 14px',
                  borderRadius: '6px'
                }}
              >
                <LogIn size={16} />
                Đăng nhập
              </Link>
              <Link
                to="/auth/register/candidate"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
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
                  border: '1px solid #cbd5e1',
                  textDecoration: 'none',
                  padding: '9px 16px',
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
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
          gap: '14px'
        }}>
          <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', textDecoration: 'none', fontWeight: 500 }}>Việc làm</Link>
          <Link to="/companies" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', textDecoration: 'none', fontWeight: 500 }}>Công ty</Link>
          <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', textDecoration: 'none', fontWeight: 500 }}>Bảng giá dịch vụ</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', textDecoration: 'none', fontWeight: 500 }}>Giới thiệu</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', textDecoration: 'none', fontWeight: 500 }}>Liên hệ</Link>
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)} style={{ textAlign: 'center', padding: '10px', color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}>Đăng nhập</Link>
            <Link to="/auth/register/candidate" onClick={() => setMobileMenuOpen(false)} style={{ textAlign: 'center', padding: '10px', backgroundColor: '#2563eb', color: '#ffffff', textDecoration: 'none', borderRadius: '6px', fontWeight: 600 }}>Đăng ký Ứng viên</Link>
            <Link to="/auth/register/employer" onClick={() => setMobileMenuOpen(false)} style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f1f5f9', color: '#0f172a', textDecoration: 'none', borderRadius: '6px', fontWeight: 600 }}>Đăng ký Doanh nghiệp</Link>
          </div>
        </div>
      )}
    </header>
  );
};
