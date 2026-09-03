import React from 'react';
import styles from './UiListPage.module.scss';

interface UiListPageProps {
  children: React.ReactNode;
}

export const UiListPage: React.FC<UiListPageProps> = ({ children }) => {
  return (
    <div className={styles.listPage}>
      {children}
    </div>
  );
};
