import React from 'react';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { Modal } from '../../../shared/components/modal/Modal';
import type { TestDetailResult } from '../../../core/models/technical-test.model';
import type { ApplicationDto } from '../../../core/models/application.model';
import styles from '../pages/EmployerAppManagePage.module.scss';

interface TestDetailModalProps {
  testDetail: TestDetailResult;
  applications: ApplicationDto[];
  onClose: () => void;
  onScheduleInterview: (app: ApplicationDto) => void;
}

export const TestDetailModal: React.FC<TestDetailModalProps> = ({
  testDetail,
  applications,
  onClose,
  onScheduleInterview
}) => {
  const isTestPassed = testDetail.status === 'PASSED' || testDetail.score >= testDetail.passingScore;
  const reviews = testDetail.questionReviews || [];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      title={
        <div className={styles.actionGroup}>
          <div className={styles.modalScoreBox}>
            {isTestPassed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </div>
          <div>
            <div className={styles.modalHeaderTitle}>
              Kết Quả Bài Test: {testDetail.candidateName}
            </div>
            <p className={styles.modalHeaderSub}>
              {testDetail.title} • {testDetail.jobTitle}
            </p>
          </div>
        </div>
      }
      footer={
        <button className={styles.btnSecondary} onClick={onClose}>Đóng</button>
      }
    >
      {/* Score card */}
      <div className={styles.testStatsGrid}>
        <div className={styles.testStatItem}>
          <div className={styles.testStatLabel}>Điểm Đạt Được</div>
          <div className={`${styles.testStatVal} ${isTestPassed ? styles.testValSuccess : styles.testValDanger}`}>
            {testDetail.score}%
          </div>
        </div>
        <div className={styles.testStatItem}>
          <div className={styles.testStatLabel}>Điểm Chuẩn Đạt</div>
          <div className={styles.testStatVal}>
            {testDetail.passingScore}%
          </div>
        </div>
        <div className={styles.testStatItem}>
          <div className={styles.testStatLabel}>Số Câu Đúng</div>
          <div className={`${styles.testStatVal} ${styles.testValPrimary}`}>
            {testDetail.correctAnswersCount}/{testDetail.totalQuestions}
          </div>
        </div>
        <div className={styles.testStatItem}>
          <div className={styles.testStatLabel}>Kết Luận</div>
          <div className={`${styles.testConclusionBadge} ${isTestPassed ? styles.conclusionPassed : styles.conclusionFailed}`}>
            {isTestPassed ? '⭐ ĐẠT CHUẨN' : 'CHƯA ĐẠT'}
          </div>
        </div>
      </div>

      {isTestPassed && (
        <div className={styles.testPassedCallout}>
          <div className={styles.candidateName}>
            ✨ Ứng viên đạt yêu cầu! Hệ thống đã chuyển trạng thái sang <strong>SƠ TUYỂN (SHORTLISTED)</strong>.
          </div>
          <button
            onClick={() => {
              const matchedApp = applications.find(a => a.id === testDetail.applicationId);
              if (matchedApp) {
                onClose();
                onScheduleInterview(matchedApp);
              }
            }}
            className={styles.btnPrimary}
          >
            <Calendar size={14} /> Lên lịch PV ngay
          </button>
        </div>
      )}

      {/* Question Reviews */}
      <div className={styles.sectionBlock}>
        <h4 className={styles.modalHeaderTitle}>Chi Tiết Từng Câu Hỏi ({reviews.length} câu)</h4>
        <div className={styles.formGroup}>
          {reviews.map((r, idx) => {
            return (
              <div
                key={r.questionId || idx}
                className={styles.testQuestionCard}
              >
                <div className={styles.kanbanCardHeader}>
                  <span className={styles.candidateName}>
                    Câu {idx + 1}: {r.questionText}
                  </span>
                  <span className={`${styles.testConclusionBadge} ${r.isCorrect ? styles.conclusionPassed : styles.conclusionFailed}`}>
                    {r.isCorrect ? '✓ Đúng' : '✕ Sai'}
                  </span>
                </div>

                {/* Options */}
                <div className={styles.testOptionsGrid}>
                  {r.options && r.options.map((opt, optIdx) => {
                    const isCandidateChoice = optIdx === r.selectedOption;
                    const isCorrectOpt = optIdx === r.correctOption;

                    let optClass = styles.optionDefault;
                    if (isCorrectOpt) {
                      optClass = styles.optionCorrect;
                    } else if (isCandidateChoice && !r.isCorrect) {
                      optClass = styles.optionIncorrect;
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`${styles.testOptionBox} ${optClass}`}
                      >
                        <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                        {isCandidateChoice && ' (Ứng viên chọn)'}
                        {isCorrectOpt && ' ✓ (Đáp án đúng)'}
                      </div>
                    );
                  })}
                </div>

                {/* AI Explanation */}
                {r.explanation && (
                  <div className={styles.testExplanationBox}>
                    💡 <strong>Giải thích chi tiết:</strong> {r.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default TestDetailModal;
