import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

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
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-200 dark:border-blue-900/50 shadow-2xl rounded-2xl p-4 transition-all duration-300 animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            Cài đặt ứng dụng HR Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Thêm vào màn hình chính để mở nhanh mọi lúc, tìm việc mượt mà ngay cả khi mạng yếu!
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Cài đặt ngay
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
