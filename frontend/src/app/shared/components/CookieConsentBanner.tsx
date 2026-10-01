import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import styles from './CookieConsentBanner.module.scss';

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
      className={styles.banner}
    >
      <div className={styles.topRow}>
        <div className={styles.iconBox}>
          <ShieldCheck size={18} />
        </div>
        <div className={styles.body}>
          <h4 className={styles.title}>
            Chính sách Cookie &amp; Bảo vệ dữ liệu
          </h4>
          <p className={styles.desc}>
            Chúng tôi dùng cookie để lưu phiên và cải thiện trải nghiệm.{' '}
            <Link to="/privacy" className={styles.privacyLink}>Chính sách bảo mật</Link>.
          </p>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Đóng banner"
          className={styles.closeBtn}
        >
          <X size={16} />
        </button>
      </div>

      <div className={styles.actions}>
        <button onClick={handleDecline} className={styles.btnDecline}>
          Cookie thiết yếu
        </button>
        <button onClick={handleAccept} className={styles.btnAccept}>
          Đồng ý tất cả
        </button>
      </div>
    </aside>
  );
};
