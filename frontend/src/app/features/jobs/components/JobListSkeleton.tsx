import React from 'react';
import styles from './JobListSkeleton.module.scss';

interface JobListSkeletonProps {
  count?: number;
}

export const JobListSkeleton: React.FC<JobListSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className={styles.skeletonWrapper} aria-busy="true" aria-label="Đang tải danh sách việc làm">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={styles.skeletonCard}>
          <div className={styles.headerRow}>
            <div className={`${styles.logoPlaceholder} ${styles.shimmer}`} />
            <div className={styles.headerContent}>
              <div className={`${styles.titleLine} ${styles.shimmer}`} />
              <div className={`${styles.companyLine} ${styles.shimmer}`} />
              <div className={styles.metaRow}>
                <div className={`${styles.metaBadge} ${styles.shimmer}`} />
                <div className={`${styles.metaBadge} ${styles.shimmer}`} />
              </div>
            </div>
          </div>
          <div className={styles.footerRow}>
            <div className={`${styles.dateLine} ${styles.shimmer}`} />
            <div className={`${styles.btnPlaceholder} ${styles.shimmer}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobListSkeleton;
