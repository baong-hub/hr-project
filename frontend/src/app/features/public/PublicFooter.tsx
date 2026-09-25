import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#0f172a',
      color: '#94a3b8',
      padding: '60px 20px 24px 20px',
      borderTop: '1px solid #1e293b'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '40px',
        paddingBottom: '40px',
        borderBottom: '1px solid #1e293b'
      }}>
        {/* Brand & Slogan */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img src="/hr.png" alt="HR Portal Logo" style={{ height: '36px', width: 'auto' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
              HR <span style={{ color: '#3b82f6' }}>Portal</span>
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#94a3b8', marginBottom: '16px' }}>
            Nền tảng tuyển dụng và kết nối nhân tài hàng đầu, tích hợp trí tuệ nhân tạo (AI Matching & Screening) tối ưu hóa thời gian tuyển dụng cho doanh nghiệp.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.85rem' }}>
            <ShieldCheck size={18} />
            <span>Tuân thủ Nghị định 13/2023/NĐ-CP về BV dữ liệu cá nhân</span>
          </div>
        </div>

        {/* For Candidates */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Dành Cho Ứng Viên</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <li><Link to="/jobs" style={{ color: '#94a3b8', textDecoration: 'none' }}>Tìm kiếm việc làm</Link></li>
            <li><Link to="/companies" style={{ color: '#94a3b8', textDecoration: 'none' }}>Danh sách công ty</Link></li>
            <li><Link to="/blog" style={{ color: '#94a3b8', textDecoration: 'none' }}>Cẩm nang nghề nghiệp & CV</Link></li>
            <li><Link to="/salary-insights" style={{ color: '#94a3b8', textDecoration: 'none' }}>Báo cáo mức lương 2026</Link></li>
            <li><Link to="/auth/register/candidate" style={{ color: '#94a3b8', textDecoration: 'none' }}>Tạo hồ sơ ứng viên</Link></li>
            <li><Link to="/candidate/cvs" style={{ color: '#94a3b8', textDecoration: 'none' }}>Quản lý CV trực tuyến</Link></li>
          </ul>
        </div>

        {/* For Employers */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Dành Cho Nhà Tuyển Dụng</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <li><Link to="/auth/register/employer" style={{ color: '#94a3b8', textDecoration: 'none' }}>Đăng ký nhà tuyển dụng</Link></li>
            <li><Link to="/pricing" style={{ color: '#94a3b8', textDecoration: 'none' }}>Bảng giá dịch vụ tuyển dụng</Link></li>
            <li><Link to="/employer/candidates" style={{ color: '#94a3b8', textDecoration: 'none' }}>Tìm kiếm hồ sơ ứng viên</Link></li>
            <li><Link to="/employer/assessments" style={{ color: '#94a3b8', textDecoration: 'none' }}>Bộ đề thi trắc nghiệm AI</Link></li>
          </ul>
        </div>

        {/* Legal & Contact */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Chính Sách & Pháp Lý</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <li><Link to="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Điều khoản dịch vụ</Link></li>
            <li><Link to="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Chính sách bảo mật (Nghị định 13)</Link></li>
            <li><Link to="/about" style={{ color: '#94a3b8', textDecoration: 'none' }}>Về chúng tôi</Link></li>
            <li><Link to="/contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>Liên hệ hợp tác</Link></li>
          </ul>
          <div style={{ marginTop: '16px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> <span>hotro@hamo.vn</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} /> <span>1900 6868 (8:00 - 18:00)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: '1280px',
        margin: '20px auto 0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.85rem'
      }}>
        <span>© {new Date().getFullYear()} HR Recruitment Portal. Bảo lưu mọi quyền.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Phát triển vì cộng đồng nhân sự Việt Nam</span>
          <Heart size={14} color="#ef4444" fill="#ef4444" />
        </div>
      </div>
    </footer>
  );
};
