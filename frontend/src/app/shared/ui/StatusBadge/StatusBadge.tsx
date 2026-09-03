import React from 'react';
import styles from './StatusBadge.module.scss';

export type StatusType = 'Draft' | 'Save' | 'Processing' | 'Completed' | 'Cancelled' | 'Unpaid' | 'Partial' | 'Paid' | 'Refunded' | 'PendingApproval' | 'Approved' | 'Rejected';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; text: string }> = {
  Draft: { color: 'secondary', text: 'Nháp' },
  Save: { color: 'success', text: 'Đã lưu' },
  Processing: { color: 'info', text: 'Đang xử lý' },
  Completed: { color: 'success', text: 'Hoàn thành' }, // Map to success (green) for completed
  Cancelled: { color: 'secondary', text: 'Đã hủy' },
  Unpaid: { color: 'danger', text: 'Chưa thanh toán' },
  Partial: { color: 'warning', text: 'Thanh toán một phần' },
  Paid: { color: 'success', text: 'Đã thanh toán' },
  Refunded: { color: 'secondary', text: 'Đã hoàn tiền' },
  PendingApproval: { color: 'warning', text: 'Chờ duyệt' },
  Approved: { color: 'info', text: 'Đã duyệt' },
  Rejected: { color: 'danger', text: 'Từ chối' }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const config = statusConfig[status] || { color: 'default', text: status };
  const displayText = label || config.text;

  return (
    <span className={`${styles.badge} ${styles[config.color]} ${className}`}>
      {displayText}
    </span>
  );
};
