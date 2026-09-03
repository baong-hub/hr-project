import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './UiListPage.module.scss';

interface UiListPageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  onBack?: () => void;
}

export const UiListPageHeader: React.FC<UiListPageHeaderProps> = ({ title, actions, onBack }) => {
  return (
    <div className={styles.headerArea}>
      <div className={styles.titleGroup}>
        {onBack && (
          <button onClick={onBack} className={styles.backButton} title="Quay lại">
            <ArrowLeft size={18} />
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.actionCluster}>
        {actions}
      </div>
    </div>
  );
};
