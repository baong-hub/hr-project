import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('hr_privacy_consent_v1');
    if (!consent) {
      // Delay showing for smooth UX
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('hr_privacy_consent_v1', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('hr_privacy_consent_v1', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside 
      aria-label="Thông báo bảo vệ dữ liệu cá nhân và Cookie"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        right: '24px',
        maxWidth: '720px',
        margin: '0 auto',
        zIndex: 9999,
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(37, 99, 235, 0.1)',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ShieldCheck size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
            Bảo vệ dữ liệu cá nhân & Trải nghiệm Cookie (Nghị định 13/2023/NĐ-CP)
          </h4>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#64748b' }}>
            HR Portal tôn trọng quyền riêng tư của bạn. Chúng tôi sử dụng cookie để lưu phiên đăng nhập, gợi ý việc làm phù hợp và thu thập dữ liệu thống kê ẩn danh nhằm cải thiện chất lượng dịch vụ. Bạn có toàn quyền quản lý, trích xuất hoặc yêu cầu xoá dữ liệu cá nhân bất kỳ lúc nào.
            Xem thêm tại <Link to="/privacy" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}>Chính sách bảo mật</Link>.
          </p>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Đóng banner"
          style={{
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleDecline}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Chỉ dùng Cookie thiết yếu
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.2s'
          }}
        >
          Đồng ý tất cả & Tiếp tục
        </button>
      </div>
    </aside>
  );
};
