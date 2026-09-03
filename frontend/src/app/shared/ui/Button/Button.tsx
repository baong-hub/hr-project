import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  loading,
  className = '', 
  ...props 
}: ButtonProps) => {
  return (
    <button 
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className} ${loading ? styles.loading : ''}`} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner}></span>
      ) : (
        icon && <span className={styles.icon}>{icon}</span>
      )}
      {children}
    </button>
  );
};
