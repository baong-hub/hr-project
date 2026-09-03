import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Calendar, CheckCircle } from 'lucide-react';
import { applicationsService } from '../../../core/services/applications.service';
import { toast } from '../../../core/services/toast.service';
import { ApplicationDto } from '../../../core/models/application.model';
import styles from './ApplicationsPage.module.scss'; // Reusing shared styles

export const CandidateAppHistoryPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await applicationsService.getApplications();
      if (res.data?.success) {
        // Flat array of applications is returned from getApplications in backend
        setApplications((res.data.data as any) || []);
      } else {
        setError(res.data?.error?.message || 'Có lỗi xảy ra khi tải dữ liệu.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      toast.error('Lỗi khi tải danh sách ứng tuyển.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getActiveLineIndex = (status: string) => {
    const statuses = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'];
    const index = statuses.indexOf(status.toUpperCase());
    if (index === -1) return 0;
    return index;
  };

  return (
    <div className={styles.applicationsPage}>
      <div className={styles.titleArea}>
        <div>
          <h1>Lịch sử việc làm đã ứng tuyển</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            Theo dõi trực quan quy trình tuyển dụng của nhà tuyển dụng đối với hồ sơ của bạn.
          </p>
        </div>
        <button className={styles.btnSecondary} onClick={fetchApplications} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Tải lại
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-text-secondary)' }}>
          <div className="spinner" style={{ marginBottom: '12px' }}></div>
          Đang tải lịch sử ứng tuyển...
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--color-error)',
          background: 'var(--color-bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--color-border-default)'
        }}>
          <p>{error}</p>
          <button className={styles.btnPrimary} onClick={fetchApplications} style={{ marginTop: '12px' }}>Thử lại</button>
        </div>
      ) : applications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 40px',
          color: 'var(--color-text-muted)',
          background: 'var(--color-bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--color-border-default)'
        }}>
          <CheckCircle size={48} style={{ margin: '0 auto 16px auto', color: 'var(--color-text-muted)', opacity: 0.5 }} />
          <h3>Chưa có hồ sơ ứng tuyển</h3>
          <p style={{ marginTop: '8px' }}>Bạn chưa nộp hồ sơ vào tin tuyển dụng nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {applications.map(app => {
            const activeIndex = getActiveLineIndex(app.status);
            const isRejected = app.status === 'REJECTED';
            const isWithdrawn = app.status === 'WITHDRAWN';

            return (
              <div key={app.id} className={styles.stepperContainer}>
                <div className={styles.candidateJobCard}>
                  <div>
                    <h3>{app.jobTitle}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      🏢 {app.companyName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                    <span>Ngày nộp: {app.appliedAt ? app.appliedAt.split('T')[0] : '—'}</span>
                    <a 
                      href={app.cvFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.btnSecondary}
                      style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileText size={12} /> Xem CV đã nộp
                    </a>
                  </div>
                </div>

                {isWithdrawn ? (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-secondary)',
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    Bạn đã rút hồ sơ ứng tuyển này.
                  </div>
                ) : (
                  <div className={styles.candidateStepper}>
                    <div className={styles.stepperLine}></div>
                    <div 
                      className={styles.stepperLineActive}
                      style={{ 
                        width: `${(activeIndex / 5) * 100}%`, 
                        backgroundColor: isRejected ? '#ef4444' : 'var(--color-brand-primary)' 
                      }}
                    ></div>

                    <div className={`${styles.candStep} ${activeIndex >= 0 ? (isRejected && activeIndex === 0 ? styles.candStepFailed : styles.candStepCompleted) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 0 ? '✓' : '1'}</div>
                      <span className={styles.candStepLabel}>Đã nộp CV</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 1 ? (isRejected && activeIndex === 1 ? styles.candStepFailed : (activeIndex === 1 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 1 ? '✓' : '2'}</div>
                      <span className={styles.candStepLabel}>Sàng lọc</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 2 ? (isRejected && activeIndex === 2 ? styles.candStepFailed : (activeIndex === 2 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 2 ? '✓' : '3'}</div>
                      <span className={styles.candStepLabel}>Shortlist</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 3 ? (isRejected && activeIndex === 3 ? styles.candStepFailed : (activeIndex === 3 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 3 ? '✓' : '4'}</div>
                      <span className={styles.candStepLabel}>Phỏng vấn</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 4 ? (isRejected && activeIndex === 4 ? styles.candStepFailed : (activeIndex === 4 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 4 ? '✓' : '5'}</div>
                      <span className={styles.candStepLabel}>Offer</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 5 ? (app.status === 'HIRED' ? styles.candStepCompleted : styles.candStepActive) : ''}`}>
                      <div className={styles.candStepCircle}>{isRejected ? '✗' : '6'}</div>
                      <span className={styles.candStepLabel}>{isRejected ? 'Bị từ chối' : 'Nhận việc'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateAppHistoryPage;
