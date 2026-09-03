import React from 'react';
import styles from './Card.module.scss';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Card = ({ children, title, className = '' }: CardProps) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && <div className={styles.header}>{title}</div>}
      <div className={styles.body}>
        {children}
      </div>
    </div>
  );
};
