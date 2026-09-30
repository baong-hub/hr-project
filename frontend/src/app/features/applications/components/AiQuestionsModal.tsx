import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';
import { Modal } from '../../../shared/components/modal/Modal';
import type { ApplicationDto } from '../../../core/models/application.model';
import type { InterviewQuestionsResult } from '../../../core/services/ai.service';
import styles from '../pages/EmployerAppManagePage.module.scss';

interface AiQuestionsModalProps {
  app: ApplicationDto;
  result: InterviewQuestionsResult | null;
  isLoading: boolean;
  onClose: () => void;
  onRegenerate: (app: ApplicationDto) => void;
}

export const AiQuestionsModal: React.FC<AiQuestionsModalProps> = ({
  app,
  result,
  isLoading,
  onClose,
  onRegenerate
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({ 0: true });
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  const toggleCategory = (idx: number) => {
    setExpandedCategories(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyQuestion = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestion(text);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const getDifficultyClass = (diff: string) => {
    switch (diff) {
      case 'Easy': return styles.diffEasy;
      case 'Medium': return styles.diffMedium;
      case 'Hard': return styles.diffHard;
      default: return '';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      title={
        <div className={styles.actionGroup}>
          <div className={styles.modalScoreBox}>
            <Brain size={24} />
          </div>
          <div>
            <div className={styles.modalHeaderTitle}>AI Gợi ý Câu hỏi Phỏng vấn</div>
            <p className={styles.modalHeaderSub}>
              {app.candidateName} — {app.jobTitle}
            </p>
          </div>
        </div>
      }
      footer={
        <div className={styles.headerControls}>
          <span className={styles.candidateEmail}>Powered by Google Gemini AI • Câu hỏi được cá nhân hóa theo JD & ứng viên</span>
          <div className={styles.headerControls}>
            <button className={styles.btnSecondary} onClick={onClose}>Đóng</button>
            {result && (
              <button
                className={styles.btnPrimary}
                onClick={() => onRegenerate(app)}
              >
                Tạo lại câu hỏi mới
              </button>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className={styles.testStatItem}>
          <div className={styles.spinnerMd} />
          <p className={styles.jobTitleText}>AI đang phân tích JD và hồ sơ ứng viên...</p>
          <p className={styles.jobDeptText}>Quá trình này có thể mất 5-15 giây</p>
        </div>
      ) : result ? (
        <div className={styles.formGroup}>
          {result.categories.map((cat, catIdx) => (
            <div key={catIdx} className={styles.iqCategoryCard}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(catIdx)}
                className={styles.iqCategoryHeader}
              >
                <div className={styles.actionGroup}>
                  <span>{cat.icon}</span>
                  <span className={styles.candidateName}>{cat.categoryName}</span>
                  <span className={styles.kanbanCount}>
                    {cat.questions.length} câu
                  </span>
                </div>
                {expandedCategories[catIdx] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {/* Questions */}
              {expandedCategories[catIdx] && (
                <div className={styles.kanbanCards}>
                  {cat.questions.map((q, qIdx) => (
                    <div key={qIdx} className={styles.iqQuestionCard}>
                      <div className={styles.kanbanCardHeader}>
                        <div className={styles.actionGroup}>
                          <span className={`${styles.iqDifficultyBadge} ${getDifficultyClass(q.difficulty)}`}>
                            {q.difficulty === 'Easy' ? '🟢' : q.difficulty === 'Medium' ? '🟡' : '🔴'} {q.difficulty}
                          </span>
                          <span className={styles.candidateEmail}>
                            Mục đích: {q.purpose}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyQuestion(q.question)}
                          className={styles.closeBtn}
                          title="Copy câu hỏi"
                        >
                          {copiedQuestion === q.question ? <CheckCheck size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className={styles.jobTitleText}>
                        Q{qIdx + 1}. {q.question}
                      </p>
                      <div className={styles.iqAnswerBox}>
                        <span className={styles.sectionTitleSuccess}>💡 Gợi ý câu trả lời tốt:</span>
                        <p className={styles.candidateEmail}>{q.expectedAnswer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.kanbanEmpty}>
          Không có dữ liệu. Vui lòng thử lại.
        </div>
      )}
    </Modal>
  );
};

export default AiQuestionsModal;
