import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Mail, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { notificationService } from '../../../core/services/notification.service';
import type { Notification } from '../../../core/models/notification.model';
import styles from './NotificationsPage.module.scss';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../core/services/toast.service';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchNotifications = async (currentPage: number, currentPageSize: number) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await notificationService.getAll({ page: currentPage, pageSize: currentPageSize });
      if (res.data?.success && res.data.data) {
        setNotifications(res.data.data.items);
        setTotalItems(res.data.data.meta.total);
        setTotalPages(res.data.data.meta.totalPages);
      } else {
        setHasError(true);
      }
    } catch (err) {
      console.error('Failed to fetch notifications list', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page, pageSize);
  }, [page, pageSize]);

  useEffect(() => {
    const handleRealtimeNotification = () => {
      if (page === 1) {
        fetchNotifications(1, pageSize);
      } else {
        setTotalItems(prev => prev + 1);
      }
    };

    window.addEventListener('app-notification-received', handleRealtimeNotification);
    return () => {
      window.removeEventListener('app-notification-received', handleRealtimeNotification);
    };
  }, [page, pageSize]);

  const handleMarkAsRead = async (id: number, redirectUrl?: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      toast.success(t('notifications.markedRead', 'Đã đánh dấu là đã đọc'));
      
      if (redirectUrl) {
        navigate(redirectUrl);
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
      toast.error(t('notifications.markReadFailed', 'Đánh dấu đọc thất bại'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success(t('notifications.markedAllRead', 'Đã đánh dấu tất cả là đã đọc'));
    } catch (err) {
      console.error('Failed to mark all as read', err);
      toast.error(t('notifications.markAllReadFailed', 'Thao tác thất bại'));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_STATUS':
        return <Check size={18} className={styles.icon_success} />;
      case 'INTERVIEW_INVITE':
        return <MessageSquare size={18} className={styles.icon_info} />;
      case 'JOB_ALERT':
        return <AlertCircle size={18} className={styles.icon_warning} />;
      default:
        return <Mail size={18} />;
    }
  };

  const getFormattedTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div className={styles.page}>
      <div className={styles.titleArea}>
        <h1>
          <Bell size={24} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-brand-primary)' }} />
          {t('notifications.centerTitle', 'Trung tâm thông báo')}
        </h1>
        {hasUnread && (
          <button className={styles.btnSecondary} onClick={handleMarkAllAsRead}>
            <Check size={16} />
            {t('notifications.markAllRead', 'Đánh dấu tất cả đã đọc')}
          </button>
        )}
      </div>

      <div className={styles.contentCard}>
        {isLoading ? (
          <div className={styles.stateContainer}>
            <span className={styles.loadingSpinner} />
            <p className={styles.stateText}>{t('common.loading', 'Đang tải danh sách thông báo...')}</p>
          </div>
        ) : hasError ? (
          <div className={styles.stateContainer}>
            <AlertCircle size={40} className={styles.errorIcon} />
            <p className={styles.stateText_error}>
              {t('notifications.loadFailed', 'Không thể tải danh sách thông báo.')}
            </p>
            <button className={styles.btnRetry} onClick={() => fetchNotifications(page, pageSize)}>
              <RefreshCw size={16} />
              {t('common.retry', 'Thử lại')}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.stateContainer}>
            <Bell size={48} className={styles.emptyIcon} />
            <h2>{t('notifications.noNotificationsTitle', 'Hộp thư trống')}</h2>
            <p className={styles.stateText_empty}>
              {t('notifications.noNotificationsDesc', 'Bạn không có thông báo nào vào lúc này.')}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.list}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`${styles.item} ${!n.isRead ? styles.item_unread : ''}`}
                  onClick={() => handleMarkAsRead(n.id, n.redirectUrl)}
                >
                  <div className={styles.item__iconWrapper}>
                    {getNotificationIcon(n.notificationType)}
                  </div>
                  <div className={styles.item__body}>
                    <div className={styles.item__header}>
                      <span className={styles.item__title}>{n.title}</span>
                      <span className={styles.item__time}>{getFormattedTime(n.createdAt)}</span>
                    </div>
                    <p className={styles.item__content}>{n.content}</p>
                  </div>
                  {!n.isRead && <span className={styles.unreadDot} />}
                </div>
              ))}
            </div>

            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                {t('common.show', 'Xem')}{' '}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className={styles.pageSizeSelect}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>{' '}
                / {totalItems} {t('notifications.records', 'thông báo')}
              </div>
              <div className={styles.paginationButtons}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  ‹
                </button>
                <span className={styles.pageIndicator}>
                  {t('common.page', 'Trang')} {page} / {totalPages || 1}
                </span>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages || totalPages === 0}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
