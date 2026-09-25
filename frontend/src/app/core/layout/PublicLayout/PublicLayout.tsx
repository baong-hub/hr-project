import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../../../features/public/PublicNavbar';
import { PublicFooter } from '../../../features/public/PublicFooter';

export const PublicLayout: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-bg-app, #f8fafc)',
      color: 'var(--color-text-primary, #0f172a)'
    }}>
      <PublicNavbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
