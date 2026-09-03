import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from '../../../../shared/ui/Modal/Modal';
import { Button } from '../../../../shared/ui/Button/Button';
import { userSessionService, type UserSessionDto } from '../../services/userSession.service';
import styles from './ActiveSessionsModal.module.scss';

interface ActiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  userName?: string;
}

export const ActiveSessionsModal: React.FC<ActiveSessionsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const [sessions, setSessions] = useState<UserSessionDto[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userSessionService.getActiveSessions(search || undefined, userId);
      if (res.success && res.data) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [search, userId]);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất từ xa thiết bị này không? Phiên làm việc sẽ bị ngắt kết nối ngay lập tức.')) {
      return;
    }

    setRevokingSessionId(sessionId);
    try {
      const res = await userSessionService.revokeSession(sessionId);
      if (res.success) {
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      } else {
        alert(res.error?.message || 'Không thể đăng xuất từ xa.');
      }
    } catch (err) {
      console.error('Error revoking session:', err);
      alert('Đã có lỗi xảy ra khi đăng xuất từ xa.');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAll = async () => {
    const targetText = userName ? `tất cả thiết bị của người dùng "${userName}"` : 'tất cả thiết bị khác';
    if (!window.confirm(`Bạn có chắc chắn muốn đăng xuất ${targetText} không?`)) {
      return;
    }

    setLoading(true);
    try {
      const targetUserId = userId || (sessions.length > 0 ? sessions[0].userId : 0);
      if (targetUserId > 0) {
        const res = await userSessionService.revokeAllUserSessions(targetUserId, true);
        if (res.success) {
          fetchSessions();
        }
      }
    } catch (err) {
      console.error('Error revoking all sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes('phone') || deviceName.toLowerCase().includes('android') || deviceName.toLowerCase().includes('iphone')) {
      return '📱';
    }
    if (deviceName.toLowerCase().includes('ipad') || deviceName.toLowerCase().includes('tablet')) {
      return 'Tablet';
    }
    return '💻';
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userName ? `Phiên đăng nhập - ${userName}` : 'Giám sát thiết bị & Phiên đăng nhập'}
      width="920px"
    >
      <div className={styles.modalContainer}>
        <div className={styles.searchHeader}>
          <input
            type="text"
            placeholder="Tìm theo Tên, Username, IP, Thiết bị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.sessionCount}>
            {sessions.length} phiên đang hoạt động
          </span>
          {userId && sessions.filter(s => !s.isCurrentSession).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAll}
              disabled={loading}
            >
              Đăng xuất các thiết bị khác
            </Button>
          )}
        </div>

        <div className={styles.tableContainer}>
          {loading && sessions.length === 0 ? (
            <div className={styles.emptyState}>Đang tải danh sách phiên...</div>
          ) : sessions.length === 0 ? (
            <div className={styles.emptyState}>Không tìm thấy phiên làm việc nào đang hoạt động.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Thiết bị / Trình duyệt</th>
                  <th>Địa chỉ IP</th>
                  <th>Thời gian đăng nhập</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.sessionId} className={s.isCurrentSession ? styles.currentSessionRow : ''}>
                    <td>
                      <div className={styles.userInfoCell}>
                        <div className={styles.avatarBadge}>
                          {s.fullName ? s.fullName.charAt(0).toUpperCase() : s.username.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userDetails}>
                          <span className={styles.fullName}>
                            {s.fullName || s.username}
                            {s.isCurrentSession && <span className={styles.currentBadge}>Thiết bị này</span>}
                          </span>
                          <span className={styles.username}>@{s.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.deviceInfo}>
                        <span className={styles.deviceIcon}>{getDeviceIcon(s.deviceName)}</span>
                        <div className={styles.deviceText}>
                          <span className={styles.deviceName}>{s.deviceName}</span>
                          <span className={styles.browser}>{s.browser}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.ipBadge}>{s.ipAddress}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div>{formatDate(s.loginTime)}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Hoạt động: {formatDate(s.lastActiveAt)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        {s.isCurrentSession ? (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Đang kết nối</span>
                        ) : (
                          <button
                            className={styles.revokeBtn}
                            onClick={() => handleRevokeSession(s.sessionId)}
                            disabled={revokingSessionId === s.sessionId}
                          >
                            {revokingSessionId === s.sessionId ? 'Đang ngắt...' : 'Đăng xuất từ xa'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.modalFooter}>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
