import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../../../features/public/PublicNavbar';
import { PublicFooter } from '../../../features/public/PublicFooter';
import styles from './PublicLayout.module.scss';

export const PublicLayout: React.FC = () => {
  return (
    <div className={`${styles.layout} public-area`}>
      <PublicNavbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
