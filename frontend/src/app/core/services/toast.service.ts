export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type Listener = (toast: ToastMessage) => void;

const listeners: Listener[] = [];

export const toast = {
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  },
  
  show: (type: ToastType, message: string, duration = 3000) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      duration
    };
    listeners.forEach(l => l(newToast));
  },
  
  success: (message: string, duration?: number) => toast.show('success', message, duration),
  error: (message: string, duration?: number) => toast.show('error', message, duration),
  info: (message: string, duration?: number) => toast.show('info', message, duration),
  warning: (message: string, duration?: number) => toast.show('warning', message, duration)
};
