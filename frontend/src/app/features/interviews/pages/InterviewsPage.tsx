import React, { useState, useEffect } from 'react';
import { 
  Video, User, CheckCircle, XCircle 
} from 'lucide-react';
import { interviewsService } from '../../../core/services/interviews.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import styles from './InterviewsPage.module.scss';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Chờ phản hồi', className: styles.badgeScheduled },
  ACCEPTED: { label: 'Đã xác nhận', className: styles.badgeAccepted },
  DECLINED: { label: 'Từ chối', className: styles.badgeDeclined },
  CANCELLED: { label: 'Đã hủy', className: styles.badgeCancelled },
  COMPLETED: { label: 'Hoàn thành', className: styles.badgeCompleted }
};

export const InterviewsPage: React.FC = () => {
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const isCandidate = roles.includes('Ứng viên');
  const isEmployer = roles.includes('Nhà tuyển dụng');

  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch interviews
  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviewsService.getInterviews();
      if (res.data?.success) {
        setInterviews(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Update Status
  const handleUpdateStatus = async (id: number, status: string) => {
    let confirmMsg = '';
    if (status === 'ACCEPTED') confirmMsg = 'Xác nhận tham gia buổi phỏng vấn này?';
    else if (status === 'DECLINED') confirmMsg = 'Bạn có chắc chắn muốn từ chối buổi phỏng vấn này?';
    else if (status === 'CANCELLED') confirmMsg = 'Bạn có chắc chắn muốn hủy lịch phỏng vấn này?';
    else if (status === 'COMPLETED') confirmMsg = 'Đánh dấu buổi phỏng vấn đã hoàn thành?';

    if (confirmMsg && !window.confirm(confirmMsg)) return;

    try {
      const res = await interviewsService.updateStatus(id, status);
      if (res.data?.success) {
        fetchInterviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Chưa xếp lịch';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.interviewsPage}>
      {/* Title area */}
      <div className={styles.titleArea}>
        <div>
          <h1>Quản lý Lịch phỏng vấn</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            {isCandidate ? 'Theo dõi lời mời phỏng vấn và phản hồi xác nhận tham gia trực tiếp' : 'Xem danh sách và trạng thái các buổi phỏng vấn đã lên lịch'}
          </p>
        </div>
      </div>

      {/* Grid table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Vị trí ứng tuyển</th>
                {isCandidate ? <th>Người phỏng vấn (Employer)</th> : <th>Ứng viên (Candidate)</th>}
                <th>Thời gian</th>
                <th>Hình thức / Địa điểm</th>
                <th>Link phòng họp</th>
                <th>Ghi chú</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>Đang tải lịch hẹn...</td></tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    Bạn chưa có lịch hẹn phỏng vấn nào.
                  </td>
                </tr>
              ) : (
                interviews.map(i => {
                  const st = STATUS_MAP[i.status.toUpperCase()] || { label: i.status, className: '' };
                  return (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 600 }}>{i.jobTitle}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={14} color="var(--color-text-secondary)" />
                          <span>{isCandidate ? i.employerName : i.candidateName}</span>
                        </div>
                      </td>
                      <td>{formatDateTime(i.scheduledAt)}</td>
                      <td>{i.location}</td>
                      <td>
                        {i.meetingLink ? (
                          <a href={i.meetingLink} target="_blank" rel="noreferrer" className={styles.meetingLink}>
                            <Video size={14} /> Google Meet
                          </a>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>Trực tiếp</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={i.notes}>
                        {i.notes || '—'}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${st.className}`}>{st.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                          {isCandidate && i.status.toUpperCase() === 'SCHEDULED' && (
                            <>
                              <button 
                                className={`${styles.actionBtn} ${styles.btnAccept}`} 
                                onClick={() => handleUpdateStatus(i.id, 'ACCEPTED')} 
                                title="Xác nhận tham gia"
                              >
                                <CheckCircle size={15} />
                              </button>
                              <button 
                                className={`${styles.actionBtn} ${styles.btnDecline}`} 
                                onClick={() => handleUpdateStatus(i.id, 'DECLINED')} 
                                title="Từ chối lời mời"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          {isEmployer && i.status.toUpperCase() !== 'CANCELLED' && i.status.toUpperCase() !== 'COMPLETED' && (
                            <>
                              <button 
                                className={styles.actionBtn} 
                                style={{ color: '#2e7d32', borderColor: '#c6f6d5' }} 
                                onClick={() => handleUpdateStatus(i.id, 'COMPLETED')} 
                                title="Hoàn thành"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button 
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`} 
                                onClick={() => handleUpdateStatus(i.id, 'CANCELLED')} 
                                title="Hủy lịch hẹn"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default InterviewsPage;
