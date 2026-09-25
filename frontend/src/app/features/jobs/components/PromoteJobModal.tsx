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
      icon: <Flame size={22} color="#ea580c" />,
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.08)',
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
      icon: <Star size={22} color="#d97706" />,
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.08)',
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
      icon: <Sparkles size={22} color="#7c3aed" />,
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.08)',
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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '820px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            border: 'none',
            background: '#f1f5f9',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563eb',
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            Pay-Per-Job & Promotion Add-ons
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
            Nâng cấp hiển thị tin tuyển dụng
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Đang áp dụng cho: <strong style={{ color: '#1e293b' }}>{job.title}</strong>
          </p>
        </div>

        {successMessage ? (
          <div style={{
            padding: '40px 24px',
            textAlign: 'center',
            background: '#f0fdf4',
            borderRadius: '16px',
            border: '1px solid #bbf7d0',
            color: '#166534'
          }}>
            <ShieldCheck size={48} style={{ margin: '0 auto 16px auto', color: '#16a34a' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>{successMessage}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>Đang làm mới danh sách...</p>
          </div>
        ) : (
          <>
            {/* Packages Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '16px',
              marginBottom: '28px'
            }}>
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    style={{
                      border: isSelected ? `2px solid ${pkg.color}` : '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '22px 18px',
                      background: isSelected ? pkg.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 8px 20px rgba(0, 0, 0, 0.08)' : 'none'
                    }}
                  >
                    {pkg.recommended && (
                      <span style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#d97706',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: '999px',
                        letterSpacing: '0.04em'
                      }}>
                        PHỔ BIẾN NHẤT
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: pkg.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {pkg.icon}
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: pkg.color,
                          color: '#ffffff'
                        }}>
                          {pkg.badge}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                        {pkg.name}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                        Thời lượng: <strong>{pkg.duration}</strong>
                      </div>

                      <div style={{ fontSize: '24px', fontWeight: 800, color: pkg.color, marginBottom: '18px' }}>
                        {pkg.price}
                      </div>

                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#475569' }}>
                        {pkg.features.map((f, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <Check size={14} style={{ color: pkg.color, flexShrink: 0, marginTop: '2px' }} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{
                      marginTop: '20px',
                      padding: '8px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: isSelected ? pkg.color : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b'
                    }}>
                      {isSelected ? 'Đang chọn gói này' : 'Chọn gói'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderTop: '1px solid #f1f5f9',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                <CreditCard size={18} color="#2563eb" />
                <span>Thanh toán tức thì qua VietQR / Chuyển khoản ngân hàng tự động</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="button"
                  onClick={handlePromote}
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    opacity: loading ? 0.7 : 1
                  }}
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
