import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Star, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  CreditCard 
} from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import type { JobDto } from '../../../core/models/job.model';
import styles from './PromoteJobModal.module.scss';

interface PromoteJobModalProps {
  job: JobDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PromoteJobModal: React.FC<PromoteJobModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedPackage, setSelectedPackage] = useState<'URGENT_7_DAYS' | 'FEATURED_14_DAYS' | 'COMBO_VIP_30_DAYS'>('FEATURED_14_DAYS');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const handlePromote = async () => {
    try {
      setLoading(true);
      await jobsService.promoteJob(job.id, selectedPackage);
      setSuccessMessage('Nâng cấp tin tuyển dụng thành công! Tin của bạn đã được ưu tiên hiển thị.');
      setTimeout(() => {
        setSuccessMessage(null);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to promote job:', err);
      alert(err.response?.data?.error?.message || 'Có lỗi xảy ra khi nâng cấp tin.');
    } finally {
      setLoading(false);
    }
  };

  const packages = [
    {
      id: 'URGENT_7_DAYS' as const,
      name: 'Gói Tuyển Gấp',
      duration: '7 ngày',
      price: '199.000đ',
      icon: <Flame size={22} />,
      typeClass: 'Urgent',
      badge: '🔥 TUYỂN GẤP',
      features: [
        'Gắn nhãn Đỏ Nổi Bật thu hút ứng viên',
        'Ưu tiên hiển thị trên danh sách việc làm',
        'Tăng 200% lượt xem và nộp hồ sơ'
      ]
    },
    {
      id: 'FEATURED_14_DAYS' as const,
      name: 'Gói Ghim VIP Nổi Bật',
      duration: '14 ngày',
      price: '399.000đ',
      icon: <Star size={22} />,
      typeClass: 'Featured',
      badge: '⭐ VIP NỔI BẬT',
      recommended: true,
      features: [
        'Ghim TOP 1 trang chủ & trang tìm kiếm',
        'Viền vàng kim loại sang trọng nổi bật',
        'Tự động gợi ý trong cẩm nang bài viết liên quan',
        'Tăng 350% tỷ lệ click ứng tuyển'
      ]
    },
    {
      id: 'COMBO_VIP_30_DAYS' as const,
      name: 'Gói Combo Đột Phá',
      duration: '30 ngày',
      price: '699.000đ',
      icon: <Sparkles size={22} />,
      typeClass: 'Combo',
      badge: '🚀 VIP + TUYỂN GẤP',
      features: [
        'Bao gồm cả 2 huy hiệu: VIP & Tuyển gấp',
        'Thời gian hiển thị tối đa 30 ngày',
        'Ưu tiên tuyệt đối vị trí số 1 kết quả tìm kiếm',
        'Hỗ trợ đẩy thông báo gợi ý tới ứng viên phù hợp'
      ]
    }
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        <div className={styles.header}>
          <span className={styles.tagline}>
            Pay-Per-Job & Promotion Add-ons
          </span>
          <h2 className={styles.title}>
            Nâng cấp hiển thị tin tuyển dụng
          </h2>
          <p className={styles.subtitle}>
            Đang áp dụng cho: <strong>{job.title}</strong>
          </p>
        </div>

        {successMessage ? (
          <div className={styles.successCard}>
            <ShieldCheck size={48} className={styles.successIcon} />
            <h3>{successMessage}</h3>
            <p>Đang làm mới danh sách...</p>
          </div>
        ) : (
          <>
            {/* Packages Grid */}
            <div className={styles.grid}>
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                const cardClass = [
                  styles.packageCard,
                  isSelected && styles[`selected${pkg.typeClass}`]
                ].filter(Boolean).join(' ');

                const iconClass = [
                  styles.iconBox,
                  styles[`icon${pkg.typeClass}`]
                ].filter(Boolean).join(' ');

                const badgeClass = [
                  styles.typeBadge,
                  styles[`badge${pkg.typeClass}`]
                ].filter(Boolean).join(' ');

                const priceClass = [
                  styles.packagePrice,
                  styles[`price${pkg.typeClass}`]
                ].filter(Boolean).join(' ');

                const selectBtnClass = [
                  styles.selectButton,
                  isSelected && styles[`selected${pkg.typeClass}Btn`]
                ].filter(Boolean).join(' ');

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={cardClass}
                  >
                    {pkg.recommended && (
                      <span className={styles.popularBadge}>
                        PHỔ BIẾN NHẤT
                      </span>
                    )}

                    <div>
                      <div className={styles.cardHeader}>
                        <div className={iconClass}>
                          {pkg.icon}
                        </div>
                        <span className={badgeClass}>
                          {pkg.badge}
                        </span>
                      </div>

                      <h3 className={styles.packageName}>
                        {pkg.name}
                      </h3>
                      <div className={styles.packageDuration}>
                        Thời lượng: <strong>{pkg.duration}</strong>
                      </div>

                      <div className={priceClass}>
                        {pkg.price}
                      </div>

                      <ul className={styles.featuresList}>
                        {pkg.features.map((f, i) => (
                          <li key={i}>
                            <Check size={14} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={selectBtnClass}>
                      {isSelected ? 'Đang chọn gói này' : 'Chọn gói'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className={styles.modalFooter}>
              <div className={styles.paymentNotice}>
                <CreditCard size={18} />
                <span>Thanh toán tức thì qua VietQR / Chuyển khoản ngân hàng tự động</span>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.cancelBtn}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="button"
                  onClick={handlePromote}
                  disabled={loading}
                  className={styles.submitBtn}
                >
                  {loading ? 'Đang xử lý kích hoạt...' : 'Kích hoạt ngay'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
