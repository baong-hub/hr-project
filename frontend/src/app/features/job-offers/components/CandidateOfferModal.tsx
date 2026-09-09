import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  MessageSquare,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Sparkles,
  MapPin,
  Building,
  AlertTriangle,
  Award
} from 'lucide-react';
import { jobOfferService } from '../../../core/services/job-offer.service';
import { toast } from '../../../core/services/toast.service';
import type { JobOffer } from '../../../core/models/job-offer.model';
import styles from './CandidateOfferModal.module.scss';

interface CandidateOfferModalProps {
  offer: JobOffer;
  onClose: () => void;
  onOfferUpdated: (updatedOffer: JobOffer) => void;
}

export const CandidateOfferModal: React.FC<CandidateOfferModalProps> = ({
  offer: initialOffer,
  onClose,
  onOfferUpdated
}) => {
  const [offer, setOffer] = useState<JobOffer>(initialOffer);
  const [activeAction, setActiveAction] = useState<'NONE' | 'NEGOTIATE' | 'DECLINE'>('NONE');

  // Negotiate state
  const [desiredSalary, setDesiredSalary] = useState<number>(offer.basicSalary || 0);
  const [negotiateNote, setNegotiateNote] = useState<string>('');

  // Decline state
  const [declineReason, setDeclineReason] = useState<string>('Đã nhận được offer khác phù hợp hơn');
  const [declineNote, setDeclineNote] = useState<string>('');

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDaysLeft = () => {
    const expiry = new Date(offer.expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysLeft();
  const canRespond = offer.status === 'PENDING' || offer.status === 'NEGOTIATING';

  // Handle Accept
  const handleAccept = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn KÝ DUYỆT CHẤP NHẬN Thư mời nhận việc cho vị trí ${offer.positionTitle} tại ${offer.companyName}?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await jobOfferService.respondOffer(offer.id, {
        action: 'ACCEPT',
        note: 'Ứng viên đã chính thức ký duyệt chấp nhận thư mời nhận việc.'
      });

      if (res.data?.success && res.data.data) {
        toast.success('Chúc mừng bạn! Bạn đã chấp nhận Thư mời nhận việc thành công.');
        setOffer(res.data.data);
        onOfferUpdated(res.data.data);
      } else {
        toast.error(res.data?.error?.message || 'Không thể gửi phản hồi.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi gửi chấp nhận Offer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Submit Negotiate
  const handleSubmitNegotiate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!negotiateNote.trim()) {
      toast.error('Vui lòng nhập nội dung đề xuất thương lượng.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await jobOfferService.respondOffer(offer.id, {
        action: 'NEGOTIATE',
        desiredSalary: Number(desiredSalary) || undefined,
        note: negotiateNote.trim()
      });

      if (res.data?.success && res.data.data) {
        toast.success('Đã gửi đề xuất thương lượng đến Nhà tuyển dụng!');
        setOffer(res.data.data);
        setActiveAction('NONE');
        onOfferUpdated(res.data.data);
      } else {
        toast.error(res.data?.error?.message || 'Không thể gửi đề xuất.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi gửi thương lượng.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Submit Decline
  const handleSubmitDecline = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!declineReason) {
      toast.error('Vui lòng chọn lý do từ chối.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn TỪ CHỐI đề xuất nhận việc này?')) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await jobOfferService.respondOffer(offer.id, {
        action: 'DECLINE',
        declineReason,
        note: declineNote.trim() || undefined
      });

      if (res.data?.success && res.data.data) {
        toast.info('Bạn đã từ chối Thư mời nhận việc.');
        setOffer(res.data.data);
        setActiveAction('NONE');
        onOfferUpdated(res.data.data);
      } else {
        toast.error(res.data?.error?.message || 'Không thể gửi từ chối.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi từ chối Offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Executive Letterhead Header */}
        <div className={styles.letterheadHeader}>
          <div className={styles.companySection}>
            {offer.companyLogo ? (
              <img src={offer.companyLogo} alt={offer.companyName} className={styles.companyLogo} />
            ) : (
              <div className={styles.companyLogoPlaceholder}>
                <Building size={32} />
              </div>
            )}
            <div className={styles.companyInfo}>
              <h1>{offer.companyName}</h1>
              <p>
                <Award size={16} /> THƯ MỜI NHẬN VIỆC CHÍNH THỨC (FORMAL JOB OFFER)
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Expiration Countdown Banner */}
        {canRespond && (
          <div className={styles.countdownBanner}>
            <div className={styles.countdownText}>
              <Clock size={16} />
              Hạn chót phản hồi đề xuất: <strong>{formatDate(offer.expiryDate)}</strong>
            </div>
            <div>
              {daysLeft > 0 ? (
                <span>Còn lại: <strong>{daysLeft} ngày</strong></span>
              ) : (
                <span style={{ color: '#dc2626' }}>Đã đến hạn chót hôm nay!</span>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Status Resolution Banners */}
          {offer.status === 'ACCEPTED' && (
            <div className={`${styles.resolutionBanner} ${styles.accepted}`}>
              <CheckCircle size={32} color="#059669" />
              <div>
                <h3>BẠN ĐÃ CHẤP NHẬN THƯ MỜI NHẬN VIỆC</h3>
                <p>
                  Trạng thái hồ sơ của bạn đã được chuyển sang <strong>HIRED</strong>. Chào mừng bạn gia nhập đội ngũ {offer.companyName}!
                </p>
              </div>
            </div>
          )}

          {offer.status === 'NEGOTIATING' && (
            <div className={`${styles.resolutionBanner} ${styles.negotiating}`}>
              <MessageSquare size={32} color="#d97706" />
              <div>
                <h3>ĐANG CHỜ PHẢN HỒI THƯƠNG LƯỢNG TỪ NHÀ TUYỂN DỤNG</h3>
                <p>
                  Bạn đã đề xuất điều chỉnh mức lương/điều khoản: "{offer.candidateResponseNote}". Nhà tuyển dụng sẽ xem xét và cập nhật lại offer cho bạn.
                </p>
              </div>
            </div>
          )}

          {offer.status === 'DECLINED' && (
            <div className={`${styles.resolutionBanner} ${styles.declined}`}>
              <XCircle size={32} color="#dc2626" />
              <div>
                <h3>BẠN ĐÃ TỪ CHỐI THƯ MỜI NHẬN VIỆC</h3>
                <p>Lý do: {offer.declineReason || 'Lý do cá nhân'}.</p>
              </div>
            </div>
          )}

          {/* Greeting */}
          <div className={styles.greetingBlock}>
            <h2>Thân gửi {offer.candidateName},</h2>
            <p>
              Đại diện cho <strong>{offer.companyName}</strong>, chúng tôi rất ấn tượng với năng lực chuyên môn và phong thái chuyên nghiệp của bạn qua các vòng phỏng vấn vừa qua. Chúng tôi trân trọng gửi tới bạn lời mời gia nhập công ty cho vị trí <strong>{offer.positionTitle}</strong> với các chế độ đãi ngộ chi tiết dưới đây:
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={`${styles.metricCard} ${styles.salary}`}>
              <div className={styles.metricHeader}>
                <DollarSign size={16} /> Tổng Thu Nhập Chính Thức
              </div>
              <div className={styles.metricValue}>
                {formatMoney(offer.totalSalary)}
              </div>
              <div className={styles.metricDetails}>
                Lương {offer.salaryType}: {formatMoney(offer.basicSalary)}
                <br />
                Phụ cấp: {formatMoney(offer.allowance)} / tháng
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.probation}`}>
              <div className={styles.metricHeader}>
                <Clock size={16} /> Giai Đoạn Thử Việc
              </div>
              <div className={styles.metricValue}>
                {formatMoney(offer.probationSalary)}
              </div>
              <div className={styles.metricDetails}>
                Thời gian: <strong>{offer.probationPeriodMonths} tháng</strong>
                <br />
                Hưởng <strong>{offer.probationSalaryPercentage}%</strong> lương cứng + 100% phụ cấp
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.timeline}`}>
              <div className={styles.metricHeader}>
                <Calendar size={16} /> Ngày Bắt Đầu Làm Việc
              </div>
              <div className={styles.metricValue}>
                {formatDate(offer.startDate)}
              </div>
              <div className={styles.metricDetails}>
                Hạn phản hồi: {formatDate(offer.expiryDate)}
                <br />
                {daysLeft > 0 ? `(Còn ${daysLeft} ngày để xác nhận)` : ''}
              </div>
            </div>
          </div>

          {/* Workplace & Details */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionHeader}>
              <MapPin size={18} /> Địa Điểm & Thời Gian Làm Việc
            </h3>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Vị trí chức danh</span>
                <span className={styles.val}>{offer.positionTitle}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Phòng ban</span>
                <span className={styles.val}>{offer.departmentName || 'Phòng Kỹ thuật / Dự án'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Địa điểm làm việc</span>
                <span className={styles.val}>{offer.workLocation || 'Theo phân công của công ty'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Thời gian làm việc</span>
                <span className={styles.val}>{offer.workingHours || 'Thứ 2 - Thứ 6 (08:30 - 17:30)'}</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          {offer.benefits && (
            <div className={styles.detailsSection}>
              <h3 className={styles.sectionHeader}>
                <Sparkles size={18} /> Chế Độ Phúc Lợi & Đãi Ngộ
              </h3>
              <div className={styles.textBlock}>{offer.benefits}</div>
            </div>
          )}

          {/* Special Terms */}
          {offer.specialTerms && (
            <div className={styles.detailsSection}>
              <h3 className={styles.sectionHeader}>
                <AlertTriangle size={18} /> Hồ Sơ Yêu Cầu & Điều Khoản Bổ Sung
              </h3>
              <div className={styles.textBlock}>{offer.specialTerms}</div>
            </div>
          )}

          {/* PDF Offer Letter Attachment */}
          {offer.offerLetterFileUrl && (
            <div className={styles.pdfDownloadBar}>
              <div className={styles.pdfInfo}>
                <FileText size={24} />
                <div>
                  <div>{offer.offerLetterFileName || 'Thu_Moi_Nhan_Viec_Chinh_Thuc.pdf'}</div>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 400 }}>
                    Văn bản có chữ ký & dấu mộc điện tử của công ty
                  </span>
                </div>
              </div>
              <a
                href={offer.offerLetterFileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadBtn}
              >
                Tải File PDF Về Máy
              </a>
            </div>
          )}

          {/* Drawer: Negotiate */}
          {activeAction === 'NEGOTIATE' && (
            <form onSubmit={handleSubmitNegotiate} className={styles.negotiateDrawer}>
              <h3>
                <MessageSquare size={18} color="#d97706" /> Đề Xuất Thương Lượng Điều Khoản Offer
              </h3>
              <div className={styles.formGroup}>
                <label>Mức lương mong muốn đề xuất ({offer.currency} / tháng)</label>
                <input
                  type="number"
                  step="1000000"
                  value={desiredSalary}
                  onChange={(e) => setDesiredSalary(Number(e.target.value))}
                  placeholder="Nhập mức lương mong muốn..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Ghi chú & Lý do mong muốn thương lượng</label>
                <textarea
                  rows={3}
                  value={negotiateNote}
                  onChange={(e) => setNegotiateNote(e.target.value)}
                  placeholder="Ví dụ: Dựa trên kinh nghiệm thực chiến và mức đóng góp kỳ vọng, tôi mong muốn công ty cân nhắc mức lương cứng 38M Gross..."
                  required
                />
              </div>

              <div className={styles.drawerActions}>
                <button
                  type="button"
                  className={styles.declineBtn}
                  onClick={() => setActiveAction('NONE')}
                  disabled={submitting}
                >
                  Đóng
                </button>
                <button type="submit" className={styles.negotiateBtn} disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Thương Lượng'}
                </button>
              </div>
            </form>
          )}

          {/* Drawer: Decline */}
          {activeAction === 'DECLINE' && (
            <form onSubmit={handleSubmitDecline} className={styles.declineDrawer}>
              <h3>
                <XCircle size={18} color="#dc2626" /> Từ Chối Đề Xuất Nhận Việc
              </h3>

              <div className={styles.formGroup}>
                <label>Lý do bạn chưa thể nhận việc tại thời điểm này</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  required
                >
                  <option value="Đã nhận được offer khác phù hợp hơn">Đã nhận được offer khác phù hợp hơn</option>
                  <option value="Mức đãi ngộ chưa đáp ứng kỳ vọng">Mức đãi ngộ chưa đáp ứng kỳ vọng</option>
                  <option value="Thời gian / Địa điểm làm việc chưa thuận tiện">Thời gian / Địa điểm làm việc chưa thuận tiện</option>
                  <option value="Định hướng nghề nghiệp thay đổi">Định hướng nghề nghiệp thay đổi</option>
                  <option value="Lý do cá nhân / Gia đình">Lý do cá nhân / Gia đình</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Lời nhắn gửi đến Nhà tuyển dụng (Không bắt buộc)</label>
                <textarea
                  rows={2}
                  value={declineNote}
                  onChange={(e) => setDeclineNote(e.target.value)}
                  placeholder="Gửi lời cảm ơn vì cơ hội trao đổi..."
                />
              </div>

              <div className={styles.drawerActions}>
                <button
                  type="button"
                  className={styles.negotiateBtn}
                  onClick={() => setActiveAction('NONE')}
                  disabled={submitting}
                >
                  Huỷ
                </button>
                <button type="submit" className={styles.declineBtn} disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Xác Nhận Từ Chối'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        {canRespond && activeAction === 'NONE' && (
          <div className={styles.modalFooter}>
            <div className={styles.actionGroup}>
              <button
                type="button"
                className={styles.declineBtn}
                onClick={() => setActiveAction('DECLINE')}
                disabled={submitting}
              >
                Từ Chối (Decline)
              </button>

              <button
                type="button"
                className={styles.negotiateBtn}
                onClick={() => setActiveAction('NEGOTIATE')}
                disabled={submitting}
              >
                Yêu Cầu Thương Lượng (Discuss)
              </button>

              <button
                type="button"
                className={styles.acceptBtn}
                onClick={handleAccept}
                disabled={submitting}
              >
                Ký Duyệt & Chấp Nhận Offer (Accept)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
