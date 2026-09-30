import React from 'react';
import { Modal } from '../../../shared/components/modal/Modal';
import type { ApplicationDto } from '../../../core/models/application.model';
import type { JobFitAnalysisResult } from '../../../core/services/ai.service';
import styles from '../pages/EmployerAppManagePage.module.scss';

interface AiMatchModalProps {
  app: ApplicationDto;
  result: JobFitAnalysisResult;
  onClose: () => void;
  onScheduleInterview: (app: ApplicationDto) => void;
}

const getInterviewRecommendation = (score: number) => {
  if (score >= 80) return { text: 'Nên mời phỏng vấn ngay', classType: styles.recSuccess, icon: '🔥' };
  if (score >= 60) return { text: 'Cân nhắc mời phỏng vấn — cần đánh giá thêm', classType: styles.recWarning, icon: '⚠️' };
  return { text: 'Chưa khuyến nghị phỏng vấn — hồ sơ chưa phù hợp', classType: styles.recDanger, icon: '🚫' };
};

export const AiMatchModal: React.FC<AiMatchModalProps> = ({
  app,
  result,
  onClose,
  onScheduleInterview
}) => {
  const rec = getInterviewRecommendation(result.matchScore);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      title={
        <div className={styles.actionGroup}>
          <div className={styles.modalScoreBox}>
            {result.matchScore}%
          </div>
          <div>
            <div className={styles.modalHeaderTitle}>AI Match Score: {result.matchLevel}</div>
            <p className={styles.modalHeaderSub}>
              {app.candidateName} → {app.jobTitle}
            </p>
          </div>
        </div>
      }
      footer={
        <>
          <button className={styles.btnSecondary} onClick={onClose}>Đóng</button>
          <button
            className={styles.btnPrimary}
            onClick={() => {
              onClose();
              onScheduleInterview(app);
            }}
          >
            Lên lịch phỏng vấn ngay
          </button>
        </>
      }
    >
      {/* AI Interview Recommendation Banner */}
      <div className={`${styles.aiRecCard} ${rec.classType}`}>
        <span>{rec.icon}</span>
        <div>
          <div className={styles.candidateName}>
            GỢI Ý PHỎNG VẤN
          </div>
          <div className={styles.candidateEmail}>
            {rec.text}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryBox}>
        <p>{result.summary}</p>
      </div>

      {/* Strengths */}
      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitleSuccess}>✅ Điểm mạnh cốt lõi</h4>
        <div className={styles.formGroup}>
          {result.strengths.map((s, i) => (
            <div key={i} className={`${styles.pointItem} ${styles.pointSuccess}`}>
              <span>💎</span> {s}
            </div>
          ))}
        </div>
      </div>

      {/* Missing Skills */}
      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitleWarning}>⚠️ Kỹ năng còn thiếu</h4>
        <div className={styles.formGroup}>
          {result.missingSkills.map((s, i) => (
            <div key={i} className={`${styles.pointItem} ${styles.pointWarning}`}>
              <span>📌</span> {s}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className={styles.sectionBlock}>
        <h4 className={styles.sectionTitlePrimary}>💡 Khuyến nghị cho Nhà tuyển dụng</h4>
        <div className={styles.formGroup}>
          {result.recommendations.map((r, i) => (
            <div key={i} className={`${styles.pointItem} ${styles.pointPrimary}`}>
              <span>🎯</span> {r}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default AiMatchModal;
