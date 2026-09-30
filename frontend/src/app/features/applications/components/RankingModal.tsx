import React from 'react';
import { Trophy, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { Modal } from '../../../shared/components/modal/Modal';
import type { ApplicationDto } from '../../../core/models/application.model';
import type { CandidateRankResult } from '../../../core/services/ai.service';
import { toast } from '../../../core/services/toast.service';
import styles from '../pages/EmployerAppManagePage.module.scss';

interface RankingModalProps {
  rankedCandidates: CandidateRankResult[];
  applications: ApplicationDto[];
  onClose: () => void;
  onApplySort: () => void;
  onScheduleInterview: (app: ApplicationDto) => void;
  onInviteTest: (app: ApplicationDto) => void;
  onViewDetail: (app: ApplicationDto) => void;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  rankedCandidates,
  applications,
  onClose,
  onApplySort,
  onScheduleInterview,
  onInviteTest,
  onViewDetail
}) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="xl"
      title={
        <div className={styles.actionGroup}>
          <div className={styles.modalScoreBox}>
            <Trophy size={22} />
          </div>
          <div>
            <div className={styles.modalHeaderTitle}>
              Bảng Xếp Hạng Ứng Viên Bằng AI
            </div>
            <p className={styles.modalHeaderSub}>
              Tự động phân tích & chấm điểm hồ sơ theo yêu cầu công việc (JD)
            </p>
          </div>
        </div>
      }
      footer={
        <button
          className={styles.btnSecondary}
          onClick={onClose}
        >
          Đóng
        </button>
      }
    >
      <div className={styles.drawerOfferHeader}>
        <span className={styles.candidateName}>
          Tìm thấy <strong>{rankedCandidates.length}</strong> ứng viên đã được AI đối chiếu và xếp hạng:
        </span>
        <button
          onClick={() => {
            onApplySort();
            onClose();
            toast.success('Đã áp dụng sắp xếp theo thứ hạng AI cho bảng danh sách!');
          }}
          className={styles.btnSecondaryAction}
        >
          <TrendingUp size={14} /> Áp dụng thứ hạng này vào danh sách
        </button>
      </div>

      {rankedCandidates.length === 0 ? (
        <div className={styles.kanbanEmpty}>
          <p>Chưa có hồ sơ ứng tuyển nào cho vị trí này để AI xếp hạng.</p>
        </div>
      ) : (
        <div className={styles.formGroup}>
          {rankedCandidates.map((cand) => {
            const isTop1 = cand.rank === 1;
            const rankIcon = isTop1 ? '🥇 #1 Top Pick' : cand.rank === 2 ? '🥈 #2 Xuất sắc' : cand.rank === 3 ? '🥉 #3 Tiềm năng' : `#${cand.rank}`;
            const matchedApp = applications.find(a => a.id === cand.applicationId);

            return (
              <div
                key={cand.applicationId}
                className={`${styles.rankCard} ${isTop1 ? styles.rankTop1 : ''}`}
              >
                {/* Top row: Rank badge + Candidate Name + Match Score */}
                <div className={styles.drawerOfferHeader}>
                  <div className={styles.actionGroup}>
                    <span className={`${styles.rankBadge} ${isTop1 ? styles.rankBadgeTop1 : ''}`}>
                      {rankIcon}
                    </span>
                    <div>
                      <div className={styles.candidateName}>
                        {cand.candidateName}
                      </div>
                      {cand.candidateEmail && (
                        <div className={styles.candidateEmail}>
                          {cand.candidateEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.actionGroup}>
                    <div>
                      <div className={`${styles.rankScoreNumber} ${cand.matchScore >= 80 ? styles.rankScoreHigh : ''}`}>
                        {cand.matchScore}%
                      </div>
                      <div className={styles.candidateEmail}>
                        {cand.matchLevel}
                      </div>
                    </div>
                    <div className={styles.modalScoreBox}>
                      <Sparkles size={18} />
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className={styles.summaryBox}>
                  💡 <strong>Khuyến nghị AI:</strong> {cand.recommendation}
                </div>

                {/* Strengths & Gaps */}
                <div className={styles.testOptionsGrid}>
                  {cand.strengths && cand.strengths.length > 0 && (
                    <div>
                      <div className={styles.sectionTitleSuccess}>
                        ✓ Điểm mạnh nổi bật:
                      </div>
                      <div className={styles.headerControls}>
                        {cand.strengths.map((s, idx) => (
                          <span key={idx} className={`${styles.rankSkillTag} ${styles.skillTagSuccess}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {cand.missingSkills && cand.missingSkills.length > 0 && (
                    <div>
                      <div className={styles.sectionTitleWarning}>
                        ⚠ Kỹ năng nên kiểm tra thêm:
                      </div>
                      <div className={styles.headerControls}>
                        {cand.missingSkills.map((m, idx) => (
                          <span key={idx} className={`${styles.rankSkillTag} ${styles.skillTagWarning}`}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {matchedApp && (
                  <div className={styles.drawerOfferHeader}>
                    <button
                      onClick={() => {
                        onClose();
                        onScheduleInterview(matchedApp);
                      }}
                      className={styles.btnPrimary}
                    >
                      <Calendar size={13} /> Lên lịch phỏng vấn
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onInviteTest(matchedApp);
                      }}
                      className={styles.btnSecondaryAction}
                    >
                      Mời làm bài Test
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onViewDetail(matchedApp);
                      }}
                      className={styles.btnSecondary}
                    >
                      Xem hồ sơ chi tiết
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default RankingModal;
