import React from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import type { JobFitAnalysisResult } from '../../../core/services/ai.service';
import styles from './AiJobFitModal.module.scss';

interface AiJobFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  analysis: JobFitAnalysisResult | null;
  jobTitle?: string;
}

export const AiJobFitModal: React.FC<AiJobFitModalProps> = ({
  isOpen,
  onClose,
  loading,
  analysis,
  jobTitle,
}) => {
  if (!isOpen) return null;

  const score = analysis?.matchScore ?? 0;
  const scoreClass = score >= 80 ? styles.high : score >= 60 ? styles.medium : styles.low;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-fit-title"
      onClick={onClose}
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrapper}>
            <div className={styles.iconBox}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 id="ai-fit-title" className={styles.modalTitle}>
                Phân tích độ phù hợp hồ sơ
              </h2>
              {jobTitle && (
                <div className={styles.modalJobSubtitle}>
                  {jobTitle}
                </div>
              )}
            </div>
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

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingBox}>
              <Sparkles size={28} />
              <span>Đang đối chiếu hồ sơ và yêu cầu tuyển dụng bằng AI...</span>
            </div>
          ) : analysis ? (
            <>
              <div className={styles.scoreBanner}>
                <span className={styles.scoreLabel}>Điểm tương thích tổng thể:</span>
                <span className={`${styles.scoreValue} ${scoreClass}`}>
                  {score}% {analysis.matchLevel ? `(${analysis.matchLevel})` : ''}
                </span>
              </div>

              {analysis.summary && (
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>
                    <TrendingUp size={15} /> Nhận định tổng quan
                  </h3>
                  <p className={styles.sectionContent}>{analysis.summary}</p>
                </div>
              )}

              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>
                    <CheckCircle2 size={15} className={styles.iconSuccess} />
                    Kỹ năng & kinh nghiệm đáp ứng
                  </h3>
                  <div className={styles.skillsList}>
                    {analysis.strengths.map((skill: string, idx: number) => (
                      <span key={idx} className={styles.skillBadge}>
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>
                    <AlertCircle size={15} className={styles.iconWarning} />
                    Kỹ năng cần bổ sung hoặc lưu ý
                  </h3>
                  <div className={styles.skillsList}>
                    {analysis.missingSkills.map((skill: string, idx: number) => (
                      <span key={idx} className={styles.skillBadge}>
                        • {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>Khuyến nghị cho ứng viên</h3>
                  <div className={styles.recommendationList}>
                    {analysis.recommendations.map((rec: string, idx: number) => (
                      <p key={idx} className={styles.sectionContent}>
                        • {rec}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.loadingBox}>
              <span>Không có dữ liệu phân tích. Vui lòng thử lại.</span>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiJobFitModal;
