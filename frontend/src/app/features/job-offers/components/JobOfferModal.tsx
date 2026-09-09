import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  DollarSign,
  Calendar,
  Briefcase,
  AlertCircle,
  Clock,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { jobOfferService } from '../../../core/services/job-offer.service';
import { toast } from '../../../core/services/toast.service';
import type { JobOffer, OfferSalaryType } from '../../../core/models/job-offer.model';
import styles from './JobOfferModal.module.scss';

interface JobOfferModalProps {
  applicationId: number;
  candidateName: string;
  candidateEmail?: string;
  jobTitle: string;
  existingOffer?: JobOffer | null;
  onClose: () => void;
  onSuccess: (offer: JobOffer) => void;
}

export const JobOfferModal: React.FC<JobOfferModalProps> = ({
  applicationId,
  candidateName,
  candidateEmail,
  jobTitle,
  existingOffer,
  onClose,
  onSuccess
}) => {
  const [positionTitle, setPositionTitle] = useState(existingOffer?.positionTitle || jobTitle || '');
  const [departmentName, setDepartmentName] = useState(existingOffer?.departmentName || 'Bộ phận Kỹ thuật & Công nghệ');
  const [workLocation, setWorkLocation] = useState(existingOffer?.workLocation || 'Văn phòng chính (TP. Hồ Chí Minh)');
  const [workingHours, setWorkingHours] = useState(existingOffer?.workingHours || 'Thứ 2 - Thứ 6 (08:30 - 17:30)');
  const [recipientEmail, setRecipientEmail] = useState(existingOffer?.candidateEmail || candidateEmail || '');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  // Compensation
  const [basicSalary, setBasicSalary] = useState<number>(existingOffer?.basicSalary || 25000000);
  const [allowance, setAllowance] = useState<number>(existingOffer?.allowance || 2000000);
  const [salaryType, setSalaryType] = useState<OfferSalaryType>(existingOffer?.salaryType || 'GROSS');
  const [currency] = useState('VND');

  // Probation
  const [probationMonths, setProbationMonths] = useState<number>(existingOffer?.probationPeriodMonths || 2);
  const [probationRate, setProbationRate] = useState<number>(existingOffer?.probationSalaryPercentage || 85);

  // Dates
  const getDefaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  };

  const getDefaultExpiryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  };

  const [startDate, setStartDate] = useState(
    existingOffer?.startDate ? existingOffer.startDate.slice(0, 10) : getDefaultStartDate()
  );
  const [expiryDate, setExpiryDate] = useState(
    existingOffer?.expiryDate ? existingOffer.expiryDate.slice(0, 10) : getDefaultExpiryDate()
  );

  // Benefits & Notes
  const [benefits, setBenefits] = useState(
    existingOffer?.benefits ||
      '• Lương tháng 13 + Thưởng hiệu suất hàng năm theo KPI\n• Bảo hiểm sức khỏe cao cấp (PVI / BaoViet Healthcare)\n• Cung cấp Laptop MacBook / Dell Precision theo yêu cầu\n• 14 ngày phép năm + chế độ Hybrid linh hoạt'
  );
  const [specialTerms, setSpecialTerms] = useState(
    existingOffer?.specialTerms || 'Hồ sơ nhận việc cần bổ sung trước ngày bắt đầu: CCCD công chứng, Bằng tốt nghiệp, Giấy khám sức khỏe.'
  );
  const [notes, setNotes] = useState(existingOffer?.notes || '');

  // File PDF Offer Letter
  const [fileUrl, setFileUrl] = useState<string | undefined>(existingOffer?.offerLetterFileUrl);
  const [fileName, setFileName] = useState<string | undefined>(existingOffer?.offerLetterFileName);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  // Calculations
  const totalOfficialSalary = (Number(basicSalary) || 0) + (Number(allowance) || 0);
  const probationBaseSalary = (Number(basicSalary) || 0) * (Number(probationRate) / 100);
  const totalProbationSalary = probationBaseSalary + (Number(allowance) || 0);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Chỉ chấp nhận tệp tin định dạng PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng file PDF vượt quá 10MB.');
      return;
    }

    setUploadingFile(true);
    try {
      const res = await jobOfferService.uploadOfferLetter(file);
      if (res.data?.success && res.data.data) {
        setFileUrl(res.data.data.fileUrl);
        setFileName(res.data.data.fileName);
        toast.success('Đã tải lên Thư mời nhận việc PDF thành công!');
      } else {
        toast.error('Lỗi khi tải file PDF lên hệ thống.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Không thể tải lên file PDF.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!positionTitle.trim()) {
      toast.error('Vui lòng nhập chức danh vị trí nhận việc.');
      return;
    }

    if (basicSalary <= 0) {
      toast.error('Mức lương cơ bản phải lớn hơn 0.');
      return;
    }

    if (!startDate) {
      toast.error('Vui lòng chọn ngày dự kiến bắt đầu làm việc.');
      return;
    }

    if (!expiryDate) {
      toast.error('Vui lòng chọn hạn chót phản hồi đề xuất.');
      return;
    }

    if (new Date(expiryDate) <= new Date()) {
      toast.error('Hạn chót phản hồi phải ở thời điểm tương lai.');
      return;
    }

    if (sendEmailNotification && !recipientEmail.trim()) {
      toast.error('Vui lòng nhập địa chỉ email (Gmail) của ứng viên để gửi thư mời.');
      return;
    }

    if (sendEmailNotification && !/^\S+@\S+\.\S+$/.test(recipientEmail.trim())) {
      toast.error('Địa chỉ email của ứng viên không đúng định dạng.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        applicationId,
        candidateEmail: sendEmailNotification ? recipientEmail.trim() : undefined,
        positionTitle: positionTitle.trim(),
        departmentName: departmentName.trim() || undefined,
        workLocation: workLocation.trim() || undefined,
        workingHours: workingHours.trim() || undefined,
        basicSalary: Number(basicSalary),
        allowance: Number(allowance) || 0,
        salaryType,
        currency,
        probationPeriodMonths: Number(probationMonths),
        probationSalaryPercentage: Number(probationRate),
        startDate: new Date(startDate).toISOString(),
        expiryDate: new Date(expiryDate + 'T23:59:59').toISOString(),
        benefits: benefits.trim() || undefined,
        specialTerms: specialTerms.trim() || undefined,
        notes: notes.trim() || undefined,
        offerLetterFileUrl: fileUrl,
        offerLetterFileName: fileName
      };

      const res = await jobOfferService.createOffer(payload);
      if (res.data?.success && res.data.data) {
        toast.success(`🎉 Phát hành Thư Mời Nhận Việc cho ứng viên ${candidateName} thành công!`);
        onSuccess(res.data.data);
      } else {
        toast.error(res.data?.error?.message || 'Không thể phát hành Thư mời.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi gửi Thư mời nhận việc.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <div>
              <h2>Phát Hành Thư Mời Nhận Việc (Job Offer)</h2>
              <p>
                Ứng viên: <strong>{candidateName}</strong> ({candidateEmail || 'Hồ sơ tuyển dụng'}) • Vị trí: <strong>{jobTitle}</strong>
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {/* If Candidate sent Counter-Offer / Negotiation Note */}
          {existingOffer?.status === 'NEGOTIATING' && (
            <div className={`${styles.alertBox} ${styles.warning}`}>
              <AlertCircle size={20} />
              <div>
                <strong>Ứng viên gửi đề xuất thương lượng lại điều khoản:</strong>
                {existingOffer.candidateDesiredSalary && (
                  <div style={{ marginTop: '4px', fontWeight: 600 }}>
                    Mức lương mong muốn: {formatMoney(existingOffer.candidateDesiredSalary)}
                  </div>
                )}
                {existingOffer.candidateResponseNote && (
                  <div style={{ marginTop: '2px', fontStyle: 'italic' }}>
                    "{existingOffer.candidateResponseNote}"
                  </div>
                )}
                <div style={{ marginTop: '4px', fontSize: '0.8rem', opacity: 0.85 }}>
                  Bạn có thể điều chỉnh các điều khoản bên dưới và nhấn "Cập nhật & Gửi lại Offer".
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Position & Workplace */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Briefcase size={18} />
              Thông tin chức danh & Địa điểm làm việc
            </h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>
                  Chức danh nhận việc <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="Ví dụ: Senior Frontend Developer"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phòng ban / Đội ngũ</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Ví dụ: Product Engineering"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Địa điểm làm việc</label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="Ví dụ: Tòa nhà Bitexco, Q1, TP.HCM hoặc Remote"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Thời gian làm việc</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="Ví dụ: Thứ 2 - Thứ 6 (08:30 - 17:30)"
                />
              </div>
            </div>
          </div>

          {/* Section: Email Notification (Gmail) */}
          <div className={styles.sectionCard} style={{ border: '1px solid #c7d2fe', background: '#f8faff' }}>
            <h3 className={styles.sectionTitle} style={{ color: '#4338ca' }}>
              <Mail size={18} />
              Gửi Thư Mời Trực Tiếp Qua Email (Gmail) Của Ứng Viên
            </h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                    Địa chỉ Gmail nhận Thư mời của ứng viên <span className={styles.required}>*</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', color: '#4338ca', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={sendEmailNotification} 
                      onChange={(e) => setSendEmailNotification(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Tự động gửi email thông báo kèm văn bản PDF
                  </label>
                </div>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Nhập địa chỉ Gmail của ứng viên (ví dụ: ungvien@gmail.com)"
                  required={sendEmailNotification}
                  disabled={!sendEmailNotification}
                  style={{
                    border: '1px solid #818cf8',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    background: sendEmailNotification ? '#ffffff' : '#f1f5f9'
                  }}
                />
                <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Hệ thống sẽ gửi email trang trọng tới địa chỉ Gmail này, bao gồm: chức danh, thu nhập, thời gian thử việc, quyền lợi, tệp PDF đính kèm và đường link để ứng viên ký duyệt chấp thuận hoặc phản hồi.
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Compensation & Gross/Net */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <DollarSign size={18} />
              Chế độ đãi ngộ & Lương thưởng chính thức
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Hình thức tính lương</label>
                <div className={styles.salaryTypeToggle}>
                  <button
                    type="button"
                    className={salaryType === 'GROSS' ? styles.active : ''}
                    onClick={() => setSalaryType('GROSS')}
                  >
                    Lương GROSS (Trước thuế)
                  </button>
                  <button
                    type="button"
                    className={salaryType === 'NET' ? styles.active : ''}
                    onClick={() => setSalaryType('NET')}
                  >
                    Lương NET (Thực nhận)
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>
                  Lương cơ bản hàng tháng ({currency}) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  step="1000000"
                  min="0"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(Number(e.target.value))}
                  placeholder="Ví dụ: 30000000"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phụ cấp cố định hàng tháng ({currency})</label>
                <input
                  type="number"
                  step="500000"
                  min="0"
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value))}
                  placeholder="Ăn trưa, đi lại, điện thoại..."
                />
              </div>

              {/* Live total official salary banner */}
              <div className={styles.summaryBanner} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.summaryCol}>
                  <span className={styles.label}>Tổng thu nhập chính thức</span>
                  <span className={styles.value}>{formatMoney(totalOfficialSalary)} / tháng</span>
                  <span className={styles.sub}>
                    Lương {salaryType}: {formatMoney(basicSalary)} + Phụ cấp: {formatMoney(allowance)}
                  </span>
                </div>
                <ShieldCheck size={36} color="#059669" />
              </div>
            </div>
          </div>

          {/* Section 3: Probation Terms & Duration */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Clock size={18} />
              Quy định thử việc & Tỷ lệ lương thử việc
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Thời gian thử việc (Tháng)</label>
                <select
                  value={probationMonths}
                  onChange={(e) => setProbationMonths(Number(e.target.value))}
                >
                  <option value={1}>1 tháng (Vị trí chuyên môn sơ cấp / kỹ thuật)</option>
                  <option value={2}>2 tháng (Vị trí chuyên viên, cử nhân, kỹ sư - Chuẩn Luật LĐ)</option>
                  <option value={3}>3 tháng (Vị trí quản lý cấp cao)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Tỷ lệ hưởng lương thử việc</label>
                <div className={styles.probationRateToggle}>
                  <button
                    type="button"
                    className={probationRate === 85 ? styles.active : ''}
                    onClick={() => setProbationRate(85)}
                  >
                    85% Lương chính (Chuẩn Luật LĐ)
                  </button>
                  <button
                    type="button"
                    className={probationRate === 100 ? styles.active : ''}
                    onClick={() => setProbationRate(100)}
                  >
                    100% Lương chính (Đãi ngộ cao)
                  </button>
                </div>
              </div>

              <div className={styles.summaryBanner} style={{ gridColumn: '1 / -1', background: '#f8fafc', borderColor: '#e2e8f0' }}>
                <div className={styles.summaryCol}>
                  <span className={styles.label} style={{ color: '#475569' }}>Lương thực tế trong giai đoạn thử việc</span>
                  <span className={styles.value} style={{ color: '#0f172a' }}>{formatMoney(totalProbationSalary)} / tháng</span>
                  <span className={styles.sub} style={{ color: '#64748b' }}>
                    {probationRate}% lương cứng ({formatMoney(probationBaseSalary)}) + 100% phụ cấp ({formatMoney(allowance)}) trong {probationMonths} tháng
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Timeline & Expiration */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={18} />
              Ngày nhận việc & Hạn phản hồi thư mời
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>
                  Ngày dự kiến nhận việc (Start Date) <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Hạn chót phản hồi Offer (Expiry Date) <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 5: Benefits & Special Terms */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              Chế độ phúc lợi & Điều khoản bổ sung
            </h3>

            <div className={styles.formGroup}>
              <label>Quyền lợi & Phúc lợi nổi bật</label>
              <textarea
                rows={4}
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="Nhập các quyền lợi dành cho ứng viên..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Điều khoản đặc biệt hoặc Lưu ý trước khi nhận việc</label>
              <textarea
                rows={2}
                value={specialTerms}
                onChange={(e) => setSpecialTerms(e.target.value)}
                placeholder="Yêu cầu về hồ sơ nhân sự, cam kết bảo mật..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ghi chú bổ sung dành cho ứng viên</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm từ phía tuyển dụng..."
              />
            </div>
          </div>

          {/* Section 6: Official PDF Offer Letter Attachment */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <FileText size={18} />
              Đính kèm Thư Mời Nhận Việc Chính Thức (PDF Offer Letter)
            </h3>

            {fileUrl ? (
              <div className={styles.fileBadge}>
                <div className={styles.fileInfo}>
                  <FileText size={20} color="#2563eb" />
                  <div>
                    <div>{fileName || 'Thu_Moi_Nhan_Viec.pdf'}</div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'underline' }}
                    >
                      Xem trước file đã tải lên
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeFileBtn}
                  onClick={() => {
                    setFileUrl(undefined);
                    setFileName(undefined);
                  }}
                  title="Xoá file đính kèm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <label className={styles.fileDropzone}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingFile}
                />
                <Upload size={32} className={styles.uploadIcon} />
                <p>
                  {uploadingFile ? 'Đang tải file PDF lên...' : 'Nhấp để chọn file PDF Thư Mời Nhận Việc có chữ ký/con dấu'}
                </p>
                <span>Hỗ trợ tệp tin định dạng .PDF tối đa 10MB</span>
              </label>
            )}
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Huỷ bỏ
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting || uploadingFile}>
              {submitting ? 'Đang gửi...' : 'Phát Hành Thư Mời (Send Offer)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
