import React, { useState } from 'react';
import { Bookmark, MapPin, Clock } from 'lucide-react';
import type { JobDto } from '../../../core/models/job.model';
import styles from './JobCardBase.module.scss';

export interface JobCardBaseProps {
  job: JobDto;
  isSaved?: boolean;
  isSelected?: boolean;
  onToggleSave?: (jobId: number, e: React.MouseEvent) => void;
  onClick?: () => void;
  className?: string;
  /** Custom slot for action buttons (e.g. Apply/Save for public, Edit/Pause/Promote for employer) */
  renderActions?: (job: JobDto) => React.ReactNode;
  /** Custom slot for top-right actions in header */
  renderHeaderActions?: (job: JobDto) => React.ReactNode;
  /** Custom badges to render beside Featured/Urgent */
  renderBadges?: (job: JobDto) => React.ReactNode;
  /** Status badge slot (e.g. StatusBadge) */
  statusBadge?: React.ReactNode;
}

export function formatSalary(from?: number | null, to?: number | null): string {
  if (!from && !to) return 'Thỏa thuận';
  const fmt = (n: number) => {
    const mil = n / 1000000;
    return Number.isInteger(mil) ? `${mil} triệu` : `${mil.toFixed(1)} triệu`;
  };
  if (from && to) {
    const fromMil = from / 1000000;
    return `${Number.isInteger(fromMil) ? fromMil : fromMil.toFixed(1)} – ${fmt(to)}`;
  }
  if (from) return `Từ ${fmt(from)}`;
  if (to) return `Đến ${fmt(to)}`;
  return 'Thỏa thuận';
}

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Gần đây';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 30) return `${diffDay} ngày trước`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} tháng trước`;
}

export const JobCardBase: React.FC<JobCardBaseProps> = ({
  job,
  isSaved = false,
  isSelected = false,
  onToggleSave,
  onClick,
  className,
  renderActions,
  renderHeaderActions,
  renderBadges,
  statusBadge
}) => {
  const [imgError, setImgError] = useState(false);

  const companyName = job.companyName || 'Doanh nghiệp tuyển dụng';
  const initial = companyName.trim().charAt(0).toUpperCase() || 'C';

  const handleClick = () => {
    if (onClick) onClick();
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSave) onToggleSave(job.id, e);
  };

  const hasHeaderActions = Boolean(renderHeaderActions || onToggleSave);

  return (
    <article
      className={`${styles.jobCard} ${job.isFeatured ? styles.featured : ''} ${isSelected ? styles.selected : ''} ${onClick ? styles.interactive : ''} ${className || ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && e.key === 'Enter') handleClick();
      }}
    >
      <div className={styles.cardHeader}>
        {/* Company Logo 56px */}
        <div className={styles.logoWrapper}>
          {job.companyLogoUrl && !imgError ? (
            <img
              src={job.companyLogoUrl}
              alt={companyName}
              className={styles.companyLogo}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <span className={styles.logoInitial}>{initial}</span>
          )}
        </div>

        {/* Title, Badges & Company */}
        <div className={styles.titleArea}>
          <div className={styles.badgesRow}>
            {job.isFeatured && <span className={styles.badgeFeatured}>Nổi bật</span>}
            {job.isUrgent && <span className={styles.badgeUrgent}>Tuyển gấp</span>}
            {renderBadges && renderBadges(job)}
            {statusBadge}
          </div>

          <h3 className={styles.jobTitle} title={job.title}>
            {job.title}
          </h3>

          <p className={styles.companyName} title={companyName}>
            {companyName}
          </p>
        </div>

        {/* Header Actions (Bookmark or custom slot) */}
        {hasHeaderActions && (
          <div className={styles.headerActions} onClick={(e) => e.stopPropagation()}>
            {renderHeaderActions ? (
              renderHeaderActions(job)
            ) : onToggleSave ? (
              <button
                type="button"
                className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
                onClick={handleSaveClick}
                aria-label={isSaved ? 'Bỏ lưu tin' : 'Lưu tin tuyển dụng'}
                title={isSaved ? 'Đã lưu' : 'Lưu việc làm'}
              >
                <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Card Footer: Salary & Meta + Action slot */}
      <div className={styles.cardFooter}>
        <div className={styles.salaryAndMeta}>
          <span className={styles.salary}>
            {formatSalary(job.salaryFrom, job.salaryTo)}
          </span>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <MapPin size={13} />
              <span>{job.city || 'Toàn quốc'}</span>
            </span>

            {job.experienceLevel && (
              <>
                <span className={styles.metaDot}>•</span>
                <span className={styles.metaItem}>
                  <span>{job.experienceLevel}</span>
                </span>
              </>
            )}

            <span className={styles.metaDot}>•</span>
            <span className={styles.metaItem}>
              <Clock size={13} />
              <span>{formatRelativeTime(job.createdAt)}</span>
            </span>
          </div>
        </div>

        {renderActions && (
          <div className={styles.actionsSlot} onClick={(e) => e.stopPropagation()}>
            {renderActions(job)}
          </div>
        )}
      </div>
    </article>
  );
};

export default JobCardBase;
