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
          <p className={styles.titleSubtitle}>
            {t('applications.history_subtitle', 'Theo dõi trực quan quy trình tuyển dụng của nhà tuyển dụng đối với hồ sơ của bạn.')}
          </p>
        </div>
        <button className={styles.btnSecondary} onClick={fetchApplications} disabled={loading}>
          {t('common.refresh', 'Tải lại')}
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingCard}>
          <div className="spinner"></div>
          <p className={styles.titleSubtitle}>{t('applications.loading', 'Đang tải lịch sử ứng tuyển...')}</p>
        </div>
      ) : error ? (
        <div className={styles.emptyStateCard}>
          <p>{error}</p>
          <button className={styles.btnPrimary} onClick={fetchApplications}>
            {t('common.retry', 'Thử lại')}
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <h3>{t('applications.empty_title', 'Chưa có hồ sơ ứng tuyển')}</h3>
          <p className={styles.titleSubtitle}>{t('applications.empty_desc', 'Bạn chưa nộp hồ sơ vào tin tuyển dụng nào.')}</p>
        </div>
      ) : (
        <div className={styles.listColumnLayout}>
          {applications.map(app => {
            const activeIndex = getActiveLineIndex(app.status);
            const isRejected = app.status === 'REJECTED';
            const isWithdrawn = app.status === 'WITHDRAWN';
            const offer = offersMap[app.id];

            let offerBannerClass = styles.offerBannerPending;
            if (offer?.status === 'ACCEPTED') offerBannerClass = styles.offerBannerAccepted;
            else if (offer?.status === 'NEGOTIATING') offerBannerClass = styles.offerBannerNegotiating;

            return (
              <div key={app.id} className={styles.stepperContainer}>
                <div className={styles.candidateJobCard}>
                  <div>
                    <h3>{app.jobTitle}</h3>
                    <span className={styles.companyNameText}>
                      {app.companyName}
                    </span>
                  </div>
                  <div className={styles.candidateJobMeta}>
                    <span>{t('applications.applied_at', { date: app.appliedAt ? app.appliedAt.split('T')[0] : '—', defaultValue: `Ngày nộp: ${app.appliedAt ? app.appliedAt.split('T')[0] : '—'}` })}</span>
                    <a 
                      href={app.cvFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.btnSecondary}
                    >
                      {t('cvs.preview_online', 'Xem CV đã nộp')}
                    </a>
                  </div>
                </div>

                {/* Offer Action Banner if an offer is received */}
                {offer && (
                  <div className={`${styles.offerBanner} ${offerBannerClass}`}>
                    <div>
                      <div className={styles.offerBannerTitle}>
                        {offer.status === 'ACCEPTED'
                          ? t('offers.status_hired', 'Bạn đã chính thức ký duyệt nhận việc thành công!')
                          : offer.status === 'NEGOTIATING'
                            ? t('offers.status_negotiating', 'Đang chờ phản hồi thương lượng từ Nhà tuyển dụng')
                            : t('offers.title', 'Bạn nhận được Thư Mời Nhận Việc (Job Offer)!')}
                      </div>
                      <div className={styles.offerBannerSubtitle}>
                        {t('offers.salary_official', 'Tổng thu nhập')}: <strong>{new Intl.NumberFormat(t('common.locale', 'vi-VN'), { style: 'currency', currency: 'VND' }).format(offer.totalSalary)} {t('offers.per_month', '/ tháng')}</strong> • {t('offers.start_date', 'Ngày bắt đầu')}: <strong>{new Date(offer.startDate).toLocaleDateString(t('common.locale', 'vi-VN'))}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveOfferModal(offer)}
                      className={offer.status === 'PENDING' ? styles.btnPrimary : styles.btnSecondary}
                    >
                      {offer.status === 'PENDING'
                        ? t('offers.btn_view_respond', 'Xem Thư Mời & Phản Hồi')
                        : t('offers.btn_view_respond', 'Xem Chi Tiết Thư Mời')}
                    </button>
                  </div>
                )}

                {isWithdrawn ? (
                  <div className={styles.withdrawnNotice}>
                    {t('applications.withdrawn_msg', 'Bạn đã rút hồ sơ ứng tuyển này.')}
                  </div>
                ) : (
                  <div className={styles.candidateStepper}>
                    <div className={styles.stepperLine}></div>
                    <div 
                      className={`${styles.stepperLineActive} ${isRejected ? styles.stepperLineActiveRejected : ''} ${styles[`progress${Math.min(100, Math.max(0, activeIndex * 20))}`]}`}
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
