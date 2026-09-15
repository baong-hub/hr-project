import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { applicationsService } from '../../../core/services/applications.service';
import { jobOfferService } from '../../../core/services/job-offer.service';
import { toast } from '../../../core/services/toast.service';
import type { ApplicationDto } from '../../../core/models/application.model';
import type { JobOffer } from '../../../core/models/job-offer.model';
import { CandidateOfferModal } from '../../job-offers/components/CandidateOfferModal';
import styles from './ApplicationsPage.module.scss'; // Reusing shared styles

export const CandidateAppHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [offersMap, setOffersMap] = useState<Record<number, JobOffer>>({});
  const [activeOfferModal, setActiveOfferModal] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resApp, resOffers] = await Promise.all([
        applicationsService.getApplications(),
        jobOfferService.getCandidateOffers().catch(() => ({ data: { data: [] } as any }))
      ]);

      if (resApp.data?.success) {
        const rawData = resApp.data.data;
        const items = Array.isArray(rawData) ? rawData : (rawData as any)?.items || [];
        setApplications(items);

        // Map offers by applicationId
        const offers: JobOffer[] = (resOffers as any)?.data?.data || [];
        const map: Record<number, JobOffer> = {};
        offers.forEach((o: JobOffer) => {
          if (o && o.applicationId) {
            map[o.applicationId] = o;
          }
        });
        setOffersMap(map);
      } else {
        setError(resApp.data?.error?.message || 'Có lỗi xảy ra khi tải dữ liệu.');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
      setError(msg);
      toast.error(msg);
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
          <h1>{t('applications.history_title', 'Lịch sử việc làm đã ứng tuyển')}</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            {t('applications.history_subtitle', 'Theo dõi trực quan quy trình tuyển dụng của nhà tuyển dụng đối với hồ sơ của bạn.')}
          </p>
        </div>
        <button className={styles.btnSecondary} onClick={fetchApplications} disabled={loading}>
          {t('common.refresh', 'Tải lại')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-text-secondary)' }}>
          <div className="spinner" style={{ marginBottom: '12px' }}></div>
          {t('applications.loading', 'Đang tải lịch sử ứng tuyển...')}
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
          <button className={styles.btnPrimary} onClick={fetchApplications} style={{ marginTop: '12px' }}>
            {t('common.retry', 'Thử lại')}
          </button>
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
          <h3>{t('applications.empty_title', 'Chưa có hồ sơ ứng tuyển')}</h3>
          <p style={{ marginTop: '8px' }}>{t('applications.empty_desc', 'Bạn chưa nộp hồ sơ vào tin tuyển dụng nào.')}</p>
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
                      {app.companyName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                    <span>{t('applications.applied_at', { date: app.appliedAt ? app.appliedAt.split('T')[0] : '—', defaultValue: `Ngày nộp: ${app.appliedAt ? app.appliedAt.split('T')[0] : '—'}` })}</span>
                    <a 
                      href={app.cvFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.btnSecondary}
                      style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center' }}
                    >
                      {t('cvs.preview_online', 'Xem CV đã nộp')}
                    </a>
                  </div>
                </div>

                {/* Offer Action Banner if an offer is received */}
                {offersMap[app.id] && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      background: offersMap[app.id].status === 'ACCEPTED'
                        ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                        : offersMap[app.id].status === 'NEGOTIATING'
                          ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                          : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      border: `1px solid ${
                        offersMap[app.id].status === 'ACCEPTED'
                          ? '#a7f3d0'
                          : offersMap[app.id].status === 'NEGOTIATING'
                            ? '#fde68a'
                            : '#bfdbfe'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                        {offersMap[app.id].status === 'ACCEPTED'
                          ? t('offers.status_hired', 'Bạn đã chính thức ký duyệt nhận việc thành công!')
                          : offersMap[app.id].status === 'NEGOTIATING'
                            ? t('offers.status_negotiating', 'Đang chờ phản hồi thương lượng từ Nhà tuyển dụng')
                            : t('offers.title', 'Bạn nhận được Thư Mời Nhận Việc (Job Offer)!')}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '2px' }}>
                        {t('offers.salary_official', 'Tổng thu nhập')}: <strong>{new Intl.NumberFormat(t('common.locale', 'vi-VN'), { style: 'currency', currency: 'VND' }).format(offersMap[app.id].totalSalary)} {t('offers.per_month', '/ tháng')}</strong> • {t('offers.start_date', 'Ngày bắt đầu')}: <strong>{new Date(offersMap[app.id].startDate).toLocaleDateString(t('common.locale', 'vi-VN'))}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveOfferModal(offersMap[app.id])}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: offersMap[app.id].status === 'PENDING' ? '#2563eb' : '#ffffff',
                        color: offersMap[app.id].status === 'PENDING' ? '#ffffff' : '#0f172a',
                        border: offersMap[app.id].status === 'PENDING' ? 'none' : '1px solid #cbd5e1',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: offersMap[app.id].status === 'PENDING' ? '0 4px 8px rgba(37,99,235,0.25)' : 'none'
                      }}
                    >
                      {offersMap[app.id].status === 'PENDING'
                        ? t('offers.btn_view_respond', 'Xem Thư Mời & Phản Hồi')
                        : t('offers.btn_view_respond', 'Xem Chi Tiết Thư Mời')}
                    </button>
                  </div>
                )}

                {isWithdrawn ? (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-secondary)',
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    {t('applications.withdrawn_msg', 'Bạn đã rút hồ sơ ứng tuyển này.')}
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
                      <span className={styles.candStepLabel}>{t('applications.stage_applied', 'Đã nộp CV')}</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 1 ? (isRejected && activeIndex === 1 ? styles.candStepFailed : (activeIndex === 1 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 1 ? '✓' : '2'}</div>
                      <span className={styles.candStepLabel}>{t('applications.stage_screening', 'Sàng lọc')}</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 2 ? (isRejected && activeIndex === 2 ? styles.candStepFailed : (activeIndex === 2 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 2 ? '✓' : '3'}</div>
                      <span className={styles.candStepLabel}>{t('applications.stage_shortlisted', 'Shortlist')}</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 3 ? (isRejected && activeIndex === 3 ? styles.candStepFailed : (activeIndex === 3 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 3 ? '✓' : '4'}</div>
                      <span className={styles.candStepLabel}>{t('applications.stage_interview', 'Phỏng vấn')}</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 4 ? (isRejected && activeIndex === 4 ? styles.candStepFailed : (activeIndex === 4 ? styles.candStepActive : styles.candStepCompleted)) : ''}`}>
                      <div className={styles.candStepCircle}>{activeIndex > 4 ? '✓' : '5'}</div>
                      <span className={styles.candStepLabel}>{t('applications.stage_offer', 'Offer')}</span>
                    </div>

                    <div className={`${styles.candStep} ${activeIndex >= 5 ? (app.status === 'HIRED' ? styles.candStepCompleted : styles.candStepActive) : ''}`}>
                      <div className={styles.candStepCircle}>{isRejected ? '✗' : '6'}</div>
                      <span className={styles.candStepLabel}>{isRejected ? t('applications.stage_rejected', 'Bị từ chối') : t('applications.stage_hired', 'Nhận việc')}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Offer Modal */}
      {activeOfferModal && (
        <CandidateOfferModal
          offer={activeOfferModal}
          onClose={() => setActiveOfferModal(null)}
          onOfferUpdated={(updated) => {
            setActiveOfferModal(updated);
            setOffersMap((prev) => ({ ...prev, [updated.applicationId]: updated }));
            fetchApplications();
          }}
        />
      )}
    </div>
  );
};

export default CandidateAppHistoryPage;
