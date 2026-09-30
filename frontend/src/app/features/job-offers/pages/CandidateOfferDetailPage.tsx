import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Building,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { jobOfferService } from '../../../core/services/job-offer.service';
import { toast } from '../../../core/services/toast.service';
import type { JobOffer } from '../../../core/models/job-offer.model';
import { CandidateOfferModal } from '../components/CandidateOfferModal';
import styles from './CandidateOfferDetailPage.module.scss';

export const CandidateOfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();

  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      if (id) {
        const res = await jobOfferService.getOfferById(Number(id));
        if (res.data?.success && res.data.data) {
          setSelectedOffer(res.data.data);
          setOffers([res.data.data]);
        } else {
          toast.error(t('error.NOT_FOUND', 'Không tìm thấy thư mời nhận việc.'));
        }
      } else {
        const res = await jobOfferService.getCandidateOffers();
        if (res.data?.success && res.data.data) {
          setOffers(res.data.data);
          if (res.data.data.length === 1) {
            setSelectedOffer(res.data.data[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t('error.SERVER_ERROR', 'Lỗi khi tải thông tin thư mời nhận việc.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [id]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat(t('common.locale', 'vi-VN'), { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return { text: t('offers.status_hired', 'Đã nhận việc (Hired)'), className: styles.badgeHired };
      case 'NEGOTIATING':
        return { text: t('offers.status_negotiating', 'Đang thương lượng'), className: styles.badgeNegotiating };
      case 'DECLINED':
        return { text: t('offers.status_declined', 'Đã từ chối'), className: styles.badgeDeclined };
      case 'EXPIRED':
        return { text: t('offers.status_expired', 'Hết hạn'), className: styles.badgeMuted };
      case 'CANCELLED':
        return { text: t('offers.status_cancelled', 'Đã thu hồi'), className: styles.badgeMuted };
      default:
        return { text: t('offers.status_pending', 'Chờ bạn phản hồi'), className: styles.badgePending };
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Header Bar */}
      <div className={styles.headerBanner}>
        <div>
          <h1 className={styles.title}>
            {t('offers.title', 'Danh Sách Thư Mời Nhận Việc (Job Offers)')}
          </h1>
          <p className={styles.subtitle}>
            {t('offers.subtitle', 'Xem chi tiết các đề xuất tuyển dụng chính thức, thương lượng mức lương hoặc ký duyệt chấp nhận gia nhập công ty.')}
          </p>
        </div>

        <span className={styles.badgeTop}>
          ✨ {t('offers.badge_top', 'Quản lý Thư Mời Nhận Việc & Ký Duyệt Trực Tuyến')}
        </span>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          {t('offers.loading', 'Đang tải thông tin thư mời nhận việc...')}
        </div>
      ) : offers.length === 0 ? (
        <div className={styles.emptyState}>
          <Inbox size={56} className={styles.emptyIcon} />
          <h3>{t('offers.empty_title', 'Chưa có Thư Mời Nhận Việc nào')}</h3>
          <p>
            {t('offers.empty_desc', 'Khi nhà tuyển dụng hoàn tất đánh giá phỏng vấn và gửi đề xuất, bạn sẽ nhận được thông báo tại đây.')}
          </p>
        </div>
      ) : (
        <div className={styles.offersList}>
          {offers.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div key={item.id} className={styles.offerCard}>
                {/* Column 1: Company Logo + Position Title */}
                <div className={styles.colCompany}>
                  <div className={styles.logo}>
                    {item.companyLogo ? (
                      <img
                        src={item.companyLogo}
                        alt={item.companyName}
                      />
                    ) : (
                      <Building size={26} className={styles.companyIcon} />
                    )}
                  </div>

                  <div className={styles.companyInfo}>
                    <h3 className={styles.positionTitle} title={item.positionTitle}>
                      {item.positionTitle}
                    </h3>
                    <div className={styles.companyName} title={item.companyName}>
                      🏢 {item.companyName}
                    </div>
                  </div>
                </div>

                {/* Column 2: Official Salary */}
                <div className={styles.colSalary}>
                  <div className={styles.label}>
                    {t('offers.salary_official', 'Thu nhập chính thức')}
                  </div>
                  <div className={styles.value}>
                    {formatMoney(item.totalSalary)} {t('offers.per_month', '/ tháng')}
                  </div>
                </div>

                {/* Column 3: Start Date */}
                <div className={styles.colDate}>
                  <div className={styles.label}>
                    {t('offers.start_date', 'Ngày nhận việc')}
                  </div>
                  <div className={styles.value}>
                    {new Date(item.startDate).toLocaleDateString(t('common.locale', 'vi-VN'))}
                  </div>
                </div>

                {/* Column 4: Status Badge */}
                <div className={styles.colStatus}>
                  <span className={`${styles.badge} ${badge.className}`}>
                    {badge.text}
                  </span>
                </div>

                {/* Column 5: Action Button */}
                <div className={styles.colAction}>
                  <button
                    onClick={() => setSelectedOffer(item)}
                    className={`${styles.btnAction} ${item.status === 'PENDING' ? styles.btnPending : styles.btnDefault}`}
                  >
                    <FileText size={16} /> {t('offers.btn_view_respond', 'Xem Thư Mời & Phản Hồi')} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render Candidate Offer Modal when selected */}
      {selectedOffer && (
        <CandidateOfferModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onOfferUpdated={(updated) => {
            setSelectedOffer(updated);
            setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          }}
        />
      )}
    </div>
  );
};
