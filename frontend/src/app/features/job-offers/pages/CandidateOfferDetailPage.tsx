import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

export const CandidateOfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();

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
          toast.error('Không tìm thấy thư mời nhận việc.');
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
      toast.error('Lỗi khi tải thông tin thư mời nhận việc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [id]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return { text: 'Đã nhận việc (Hired)', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'NEGOTIATING':
        return { text: 'Đang thương lượng', bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'DECLINED':
        return { text: 'Đã từ chối', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'EXPIRED':
        return { text: 'Hết hạn', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
      case 'CANCELLED':
        return { text: 'Đã thu hồi', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
      default:
        return { text: 'Chờ bạn phản hồi', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Header Bar */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
            Danh Sách Thư Mời Nhận Việc (Job Offers)
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Xem chi tiết các đề xuất tuyển dụng chính thức, thương lượng mức lương hoặc ký duyệt chấp nhận gia nhập công ty.
          </p>
        </div>

        <span style={{
          fontSize: '0.875rem',
          color: '#64748b',
          background: '#f1f5f9',
          padding: '6px 14px',
          borderRadius: '8px',
          fontWeight: 500
        }}>
          Quản lý Thư Mời Nhận Việc & Ký Duyệt Trực Tuyến
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div className="spinner" style={{ marginBottom: '12px' }} />
          Đang tải thông tin thư mời nhận việc...
        </div>
      ) : offers.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <Inbox size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Chưa có Thư Mời Nhận Việc nào</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Khi nhà tuyển dụng hoàn tất đánh giá phỏng vấn và gửi đề xuất, bạn sẽ nhận được thông báo tại đây.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {offers.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: '280px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {item.companyLogo ? (
                      <img
                        src={item.companyLogo}
                        alt={item.companyName}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Building size={28} color="#0284c7" />
                    )}
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                      {item.positionTitle}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                      🏢 {item.companyName}
                    </div>
                  </div>
                </div>

                {/* Salary & Start Date info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Thu nhập chính thức
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                      {formatMoney(item.totalSalary)} / tháng
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Ngày nhận việc
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                      {new Date(item.startDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}
                  >
                    {badge.text}
                  </span>
                </div>

                {/* Open Modal Button */}
                <button
                  onClick={() => setSelectedOffer(item)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: item.status === 'PENDING' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f8fafc',
                    color: item.status === 'PENDING' ? '#ffffff' : '#0f172a',
                    border: item.status === 'PENDING' ? 'none' : '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: item.status === 'PENDING' ? '0 4px 10px rgba(2,132,199,0.3)' : 'none'
                  }}
                >
                  <FileText size={16} /> Xem Thư Mời & Phản Hồi <ChevronRight size={16} />
                </button>
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
