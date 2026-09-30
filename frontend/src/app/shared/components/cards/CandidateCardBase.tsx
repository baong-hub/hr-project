import React, { useState } from 'react';
import { Briefcase, MapPin, UserCheck, Clock } from 'lucide-react';
import type { CandidateProfileDto } from '../../../core/models/cv.model';
import styles from './CandidateCardBase.module.scss';

export interface CandidateCardBaseProps {
  candidate: CandidateProfileDto;
  className?: string;
  renderActions?: (candidate: CandidateProfileDto) => React.ReactNode;
  renderBadges?: (candidate: CandidateProfileDto) => React.ReactNode;
  onClick?: () => void;
}

export const CandidateCardBase: React.FC<CandidateCardBaseProps> = ({
  candidate,
  className,
  renderActions,
  renderBadges,
  onClick
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = candidate.fullName?.trim().charAt(0).toUpperCase() || 'U';

  return (
    <article
      className={`${styles.candidateCard} ${className || ''}`}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        {/* Avatar 56px */}
        <div className={styles.avatarWrapper}>
          {candidate.avatarUrl && !imgError ? (
            <img
              src={candidate.avatarUrl}
              alt={candidate.fullName}
              className={styles.avatarImg}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className={styles.avatarInitial}>{initial}</span>
          )}
        </div>

        {/* Content */}
        <div className={styles.titleArea}>
          <div className={styles.headerTopRow}>
            <h3 className={styles.candidateName}>{candidate.fullName}</h3>
            {renderBadges ? (
              renderBadges(candidate)
            ) : (
              <span className={styles.visibilityBadge}>
                <UserCheck size={11} /> PUBLIC
              </span>
            )}
          </div>

          {candidate.currentPosition && (
            <div className={styles.positionTitle}>{candidate.currentPosition}</div>
          )}

          <div className={styles.metaRow}>
            {candidate.currentCompany && (
              <div className={styles.metaItem}>
                <Briefcase />
                <span>{candidate.currentCompany}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <Clock />
              <span>
                {candidate.totalYearsExperience
                  ? `${candidate.totalYearsExperience} năm kinh nghiệm`
                  : 'Dưới 1 năm kinh nghiệm'}
              </span>
            </div>
            {candidate.location && (
              <div className={styles.metaItem}>
                <MapPin />
                <span>{candidate.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {candidate.objective && (
        <p className={styles.objective}>{candidate.objective}</p>
      )}

      {/* Skills Badges */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className={styles.skillsRow}>
          {candidate.skills.slice(0, 8).map((s, idx) => (
            <span key={idx} className={styles.skillBadge}>
              {s}
            </span>
          ))}
          {candidate.skills.length > 8 && (
            <span className={styles.skillBadgeMore}>
              +{candidate.skills.length - 8}
            </span>
          )}
        </div>
      )}

      {/* Action Footer */}
      {renderActions && (
        <div className={styles.cardFooter}>
          {renderActions(candidate)}
        </div>
      )}
    </article>
  );
};
