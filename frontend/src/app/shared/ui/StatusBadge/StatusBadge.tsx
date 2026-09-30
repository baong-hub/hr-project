import React from 'react';
import { StatusBadge as BaseStatusBadge, type StatusContextType } from '../../components/status-badge';

export type StatusType = 
  | 'Draft' 
  | 'Save' 
  | 'Processing' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Unpaid' 
  | 'Partial' 
  | 'Paid' 
  | 'Refunded' 
  | 'PendingApproval' 
  | 'Approved' 
  | 'Rejected'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  type?: StatusContextType;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'payment', label, className = '' }) => {
  return (
    <BaseStatusBadge
      status={status}
      type={type}
      label={label}
      className={className}
    />
  );
};

export default StatusBadge;
