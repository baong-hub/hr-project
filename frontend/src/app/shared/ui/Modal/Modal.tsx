import React from 'react';
import styles from './Modal.module.scss';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const Modal = ({ isOpen, onClose, title, children, footer, width = '600px' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        style={{ width }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
