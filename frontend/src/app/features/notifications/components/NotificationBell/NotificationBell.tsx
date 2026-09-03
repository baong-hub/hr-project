import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { notificationService } from '../../../../core/services/notification.service';
import { Notification } from '../../../../core/models/notification.model';
import styles from './NotificationBell.module.scss';
import { useTranslation } from 'react-i18next';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const countRes = await notificationService.getUnreadCount();
      if (countRes.data?.success && countRes.data.data) {
        setUnreadCount(countRes.data.data.count);
      }

      setIsLoading(true);
      const listRes = await notificationService.getAll({ page: 1, pageSize: 10 });
      if (listRes.data?.success && listRes.data.data) {
        setNotifications(listRes.data.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch notification data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time events from SignalR service
    const handleRealtimeNotification = (e: Event) => {
      const customEvent = e as CustomEvent<Notification>;
      const newNotif = customEvent.detail;
      
      setUnreadCount(prev => prev + 1);
      setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
    };

    window.addEventListener('app-notification-received', handleRealtimeNotification);

    return () => {
      window.removeEventListener('app-notification-received', handleRealtimeNotification);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchData();
    }
  };

  const handleMarkAsRead = async (id: number, redirectUrl?: string) => {
    try {
      await notificationService.markAsRead(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
    setIsOpen(false);
    if (redirectUrl) {
      navigate(redirectUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_STATUS':
        return <Check size={16} className={styles.icon_success} />;
      case 'INTERVIEW_INVITE':
        return <MessageSquare size={16} className={styles.icon_info} />;
      case 'JOB_ALERT':
        return <AlertCircle size={16} className={styles.icon_warning} />;
      default:
        return <Mail size={16} />;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.bellBtn} 
        onClick={handleToggle}
        title={t('notifications.title', 'Thông báo')}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdown__header}>
            <span className={styles.dropdown__title}>{t('notifications.title', 'Thông báo')}</span>
            {unreadCount > 0 && (
              <button className={styles.readAllBtn} onClick={handleMarkAllAsRead}>
                {t('notifications.markAllRead', 'Đánh dấu tất cả đã đọc')}
              </button>
            )}
          </div>

          <div className={styles.dropdown__body}>
            {isLoading && notifications.length === 0 ? (
              <div className={styles.stateContainer}>
                <span className={styles.loadingSpinner} />
                <p className={styles.stateText}>{t('common.loading', 'Đang tải...')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.stateContainer}>
                <p className={styles.stateText_empty}>
                  {t('notifications.noNotifications', 'Không có thông báo nào')}
                </p>
              </div>
            ) : (
              <div className={styles.list}>
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`${styles.item} ${!n.isRead ? styles.item_unread : ''}`}
                    onClick={() => handleMarkAsRead(n.id, n.redirectUrl)}
                  >
                    <div className={styles.item__iconContainer}>
                      {getNotificationIcon(n.notificationType)}
                    </div>
                    <div className={styles.item__content}>
                      <span className={styles.item__title}>{n.title}</span>
                      <p className={styles.item__text}>{n.content}</p>
                      <span className={styles.item__time}>{getRelativeTime(n.createdAt)}</span>
                    </div>
                    {!n.isRead && <span className={styles.unreadDot} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.dropdown__footer}>
            <button 
              className={styles.viewAllBtn} 
              onClick={() => { navigate('/notifications'); setIsOpen(false); }}
            >
              {t('notifications.viewAll', 'Xem tất cả thông báo')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
