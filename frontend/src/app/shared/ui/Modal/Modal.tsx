import React from 'react';
import { Modal as BaseModal } from '../../components/modal/Modal';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  width,
  size,
  ...props
}) => {
  let resolvedSize: 'sm' | 'md' | 'lg' | 'xl' | 'full' = size || 'md';
  if (width) {
    const num = parseInt(width, 10);
    if (!isNaN(num)) {
      if (num <= 500) resolvedSize = 'sm';
      else if (num <= 650) resolvedSize = 'md';
      else if (num <= 850) resolvedSize = 'lg';
      else resolvedSize = 'xl';
    }
  }

  return <BaseModal {...props} size={resolvedSize} />;
};

export default Modal;
