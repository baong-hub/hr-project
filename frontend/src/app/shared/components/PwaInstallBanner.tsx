import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import styles from './PwaInstallBanner.module.scss';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (e.g. within 7 days)
    const dismissedTime = localStorage.getItem('pwa_banner_dismissed_at');
    if (dismissedTime) {
      const daysPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 7) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_banner_dismissed_at', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <aside 
      aria-label="Cài đặt ứng dụng HR Portal"
      className={styles.pwaBanner}
    >
      <div className={styles.contentWrapper}>
        <div className={styles.iconBox}>
          <Smartphone size={22} />
        </div>
        <div className={styles.body}>
          <h2 className={styles.title}>
            Cài đặt ứng dụng HR Portal
          </h2>
          <p className={styles.desc}>
            Thêm vào màn hình chính để mở nhanh mọi lúc, tìm việc mượt mà ngay cả khi mạng yếu!
          </p>
          <div className={styles.actions}>
            <button
              onClick={handleInstallClick}
              className={styles.installBtn}
            >
              <Download size={14} />
              Cài đặt ngay
            </button>
            <button
              onClick={handleDismiss}
              className={styles.dismissBtn}
            >
              Để sau
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className={styles.closeBtn}
          title="Đóng"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
};
