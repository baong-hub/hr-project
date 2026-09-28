import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { JobDto } from '../../../core/models/job.model';
import styles from './ApplyJobModal.module.scss';

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDto | null;
  cvs: any[];
  onSubmit: (cvId: number, coverLetter: string) => Promise<void>;
  submitting: boolean;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  isOpen,
  onClose,
  job,
  cvs,
  onSubmit,
  submitting,
}) => {
  const navigate = useNavigate();
  const [selectedCvId, setSelectedCvId] = useState<number | ''>('');
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (cvs && cvs.length > 0) {
      const main = cvs.find((c) => c.isMain);
      if (main) {
        setSelectedCvId(main.id);
      } else {
        setSelectedCvId(cvs[0].id);
      }
    } else {
      setSelectedCvId('');
    }
  }, [cvs]);

  if (!isOpen || !job) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCvId) return;
    onSubmit(Number(selectedCvId), coverLetter);
  };

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
      onClick={onClose}
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitles}>
            <h2 id="apply-modal-title" className={styles.modalTitle}>
              Nộp hồ sơ ứng tuyển
            </h2>
            <p className={styles.jobSubtitle}>
              {job.title} — {job.companyName}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="select-cv-input">Chọn hồ sơ CV ứng tuyển</label>
              <p className={styles.fieldDesc}>
                Hồ sơ này sẽ được chuyển trực tiếp đến bộ phận tuyển dụng của công ty.
              </p>

              {cvs.length === 0 ? (
                <div className={styles.noCvWarning}>
                  <div className={styles.warningTitle}>
                    <AlertCircle size={16} />
                    <strong>Bạn chưa có bản CV nào trong hệ thống</strong>
                  </div>
                  <span>
                    Vui lòng tải lên hoặc tạo một bản CV mới để nộp hồ sơ vào vị trí này.
                  </span>
                  <span
                    className={styles.uploadCvLink}
                    onClick={() => {
                      onClose();
                      navigate('/candidate/cv');
                    }}
                  >
                    Tạo / Tải lên CV ngay →
                  </span>
                </div>
              ) : (
                <select
                  id="select-cv-input"
                  className={styles.selectInput}
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(Number(e.target.value))}
                  required
                >
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cvTitle} {c.isMain ? '★ (CV chính)' : ''} — Cập nhật:{' '}
                      {new Date(c.updatedAt || c.createdAt).toLocaleDateString('vi-VN')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cover-letter-input">Thư giới thiệu (Không bắt buộc)</label>
              <p className={styles.fieldDesc}>
                Nêu ngắn gọn lý do bạn phù hợp với công việc và mong muốn cống hiến cho công ty.
              </p>
              <textarea
                id="cover-letter-input"
                className={styles.textareaInput}
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                maxLength={2000}
                placeholder="Kính gửi phòng Tuyển dụng, tôi có hơn 2 năm kinh nghiệm trong lĩnh vực..."
              />
              <div className={styles.charCount}>
                {coverLetter.length} / 2000 ký tự
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !selectedCvId || cvs.length === 0}
            >
              {submitting ? (
                'Đang gửi hồ sơ...'
              ) : (
                <>
                  <Send size={14} /> Gửi hồ sơ ứng tuyển
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyJobModal;
