import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  ExternalLink,
  Bookmark,
  CheckCircle,
} from 'lucide-react';
import type { JobDto } from '../../../core/models/job.model';
import styles from './JobDetailPane.module.scss';

interface JobDetailPaneProps {
  job: JobDto | null;
  onApply: (job: JobDto) => void;
  onToggleSave: (jobId: number) => void;
  isSaved: boolean;
  hasApplied: boolean;
  togglingSave: boolean;
}

export const JobDetailPane: React.FC<JobDetailPaneProps> = ({
  job,
  onApply,
  onToggleSave,
  isSaved,
  hasApplied,
  togglingSave,
}) => {
  const [imgError, setImgError] = useState(false);

  if (!job) {
    return (
      <div className={styles.detailPane}>
        <div className={styles.emptyPane}>
          <Briefcase size={40} />
          <p>Chọn một tin tuyển dụng bên trái để xem nhanh thông tin chi tiết</p>
        </div>
      </div>
    );
  }

  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return 'Thỏa thuận';
    const fmt = (n: number) => (n / 1000000).toFixed(0) + ' triệu';
    if (from && to) return `${fmt(from)} - ${fmt(to)}`;
    if (from) return `Từ ${fmt(from)}`;
    return `Đến ${fmt(to!)}`;
  };

  const initial = job.companyName ? job.companyName.trim().charAt(0).toUpperCase() : 'C';

  return (
    <article className={styles.detailPane} aria-label={`Chi tiết ${job.title}`}>
      <div className={styles.paneHeader}>
        <div className={styles.companyRow}>
          <div className={styles.logoWrapper}>
            {job.companyLogoUrl && !imgError ? (
              <img
                src={job.companyLogoUrl}
                alt={job.companyName}
                className={styles.logoImg}
                onError={() => setImgError(true)}
              />
            ) : (
              <span className={styles.logoInitial}>{initial}</span>
            )}
          </div>
          <div className={styles.companyMeta}>
            {job.companyId ? (
              <Link to={`/companies/${job.companyId}`} className={styles.companyLink}>
                {job.companyName}
              </Link>
            ) : (
              <span className={styles.companyLink}>{job.companyName}</span>
            )}
            <span className={styles.companyLocation}>
              {job.city || 'Toàn quốc'}
            </span>
          </div>
        </div>

        <h2 className={styles.jobTitle}>{job.title}</h2>

        {/* 4 Summary Blocks */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <DollarSign size={16} className={styles.itemIcon} />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>Mức lương</span>
              <span className={`${styles.itemValue} ${styles.salaryHighlight}`}>
                {formatSalary(job.salaryFrom, job.salaryTo)}
              </span>
            </div>
          </div>

          <div className={styles.summaryItem}>
            <MapPin size={16} className={styles.itemIcon} />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>Địa điểm</span>
              <span className={styles.itemValue} title={job.city}>
                {job.city || 'Toàn quốc'}
              </span>
            </div>
          </div>

          <div className={styles.summaryItem}>
            <Briefcase size={16} className={styles.itemIcon} />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>Kinh nghiệm</span>
              <span className={styles.itemValue}>
                {job.experienceLevel || 'Không yêu cầu'}
              </span>
            </div>
          </div>

          <div className={styles.summaryItem}>
            <Clock size={16} className={styles.itemIcon} />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>Hạn nộp</span>
              <span className={styles.itemValue}>
                {job.expiredAt ? new Date(job.expiredAt).toLocaleDateString('vi-VN') : 'Tuyển liên tục'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className={styles.actionRow}>
          {hasApplied ? (
            <button type="button" disabled className={styles.appliedBtn}>
              <CheckCircle size={14} /> Đã ứng tuyển
            </button>
          ) : (
            <button
              type="button"
              className={styles.applyBtn}
              onClick={() => onApply(job)}
            >
              Ứng tuyển ngay
            </button>
          )}

          <button
            type="button"
            className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
            onClick={() => onToggleSave(job.id)}
            disabled={togglingSave}
          >
            <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Đã lưu' : 'Lưu tin'}
          </button>

          <Link
            to={`/jobs/${job.id}`}
            className={styles.viewFullLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Mở trang chi tiết</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Pane Body */}
      <div className={styles.paneBody}>
        {job.description && (
          <div className={styles.proseSection}>
            <h3>Mô tả công việc</h3>
            <p>{job.description}</p>
          </div>
        )}

        {job.requirements && (
          <div className={styles.proseSection}>
            <h3>Yêu cầu ứng viên</h3>
            <p>{job.requirements}</p>
          </div>
        )}

        {job.benefits && (
          <div className={styles.proseSection}>
            <h3>Quyền lợi phúc lợi</h3>
            <p>{job.benefits}</p>
          </div>
        )}
      </div>
    </article>
  );
};

export default JobDetailPane;
