import { useEffect, useState, useRef } from 'react';
import { toast, type ToastMessage } from '../../../core/services/toast.service';
import styles from './Toast.module.scss';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
}

const ToastItem = ({ toast: t, onRemove, getIcon }: ToastItemProps) => {
  const timerRef = useRef<any>(null);

  const startTimer = () => {
    if (t.duration) {
      timerRef.current = setTimeout(() => {
        onRemove(t.id);
      }, t.duration);
    }
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, []);

  return (
    <div 
      className={`${styles.toast} ${styles[t.type]}`}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
    >
      <div className={styles.iconBox}>{getIcon(t.type)}</div>
      <div className={styles.messageBox}>{t.message}</div>
      <button className={styles.closeBtn} onClick={() => onRemove(t.id)}>
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts(prev => [...prev, newToast]);
    });
    
    return () => unsubscribe();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className={styles.iconSuccess} />;
      case 'error': return <AlertCircle size={20} className={styles.iconError} />;
      case 'warning': return <AlertTriangle size={20} className={styles.iconWarning} />;
      case 'info': return <Info size={20} className={styles.iconInfo} />;
      default: return null;
    }
  };

  return (
    <div className={styles.toastContainer}>
      {toasts.map(t => (
        <ToastItem 
          key={t.id} 
          toast={t} 
          onRemove={removeToast} 
          getIcon={getIcon} 
        />
      ))}
    </div>
  );
};
