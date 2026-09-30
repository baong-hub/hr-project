import React from 'react';
import styles from './StatusBadge.module.scss';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type StatusContextType = 
  | 'job' 
  | 'application' 
  | 'interview' 
  | 'offer' 
  | 'test' 
  | 'user' 
  | 'payment' 
  | 'generic';

export interface StatusConfig {
  text: string;
  tone: StatusTone;
}

const STATUS_DICTIONARY: Record<StatusContextType, Record<string, StatusConfig>> = {
  job: {
    PUBLISHED: { text: 'Đang hiển thị', tone: 'success' },
    OPEN: { text: 'Đang hiển thị', tone: 'success' },
    ACTIVE: { text: 'Hoạt động', tone: 'success' },
    PAUSED: { text: 'Tạm dừng', tone: 'warning' },
    CLOSED: { text: 'Đã đóng', tone: 'neutral' },
    EXPIRED: { text: 'Hết hạn', tone: 'neutral' },
    DRAFT: { text: 'Bản nháp', tone: 'neutral' },
    PENDING_APPROVAL: { text: 'Chờ duyệt', tone: 'warning' },
    REJECTED: { text: 'Từ chối duyệt', tone: 'danger' }
  },
  application: {
    APPLIED: { text: 'Mới ứng tuyển', tone: 'info' },
    NEW: { text: 'Mới ứng tuyển', tone: 'info' },
    SCREENING: { text: 'Sàng lọc CV', tone: 'warning' },
    SHORTLISTED: { text: 'Phù hợp (Shortlist)', tone: 'success' },
    INTERVIEW: { text: 'Phỏng vấn', tone: 'info' },
    INTERVIEWING: { text: 'Phỏng vấn', tone: 'info' },
    OFFER: { text: 'Đề nghị (Offer)', tone: 'warning' },
    HIRED: { text: 'Đã nhận việc', tone: 'success' },
    REJECTED: { text: 'Từ chối', tone: 'danger' },
    WITHDRAWN: { text: 'Đã rút đơn', tone: 'neutral' }
  },
  interview: {
    SCHEDULED: { text: 'Đã lên lịch', tone: 'info' },
    INVITED: { text: 'Đã mời', tone: 'info' },
    CONFIRMED: { text: 'Đã xác nhận', tone: 'success' },
    CANDIDATE_ACCEPTED: { text: 'Ứng viên xác nhận', tone: 'success' },
    CANDIDATE_DECLINED: { text: 'Ứng viên từ chối', tone: 'danger' },
    COMPLETED: { text: 'Đã phỏng vấn', tone: 'success' },
    CANCELLED: { text: 'Đã hủy', tone: 'danger' },
    RESCHEDULED: { text: 'Dời lịch hẹn', tone: 'warning' }
  },
  offer: {
    DRAFT: { text: 'Bản nháp', tone: 'neutral' },
    SENT: { text: 'Đã gửi offer', tone: 'info' },
    PENDING: { text: 'Chờ phản hồi', tone: 'warning' },
    ACCEPTED: { text: 'Đã chấp thuận', tone: 'success' },
    REJECTED: { text: 'Đã từ chối', tone: 'danger' },
    NEGOTIATING: { text: 'Đang thương lượng', tone: 'warning' },
    CANCELLED: { text: 'Đã thu hồi', tone: 'neutral' },
    EXPIRED: { text: 'Hết hạn phản hồi', tone: 'neutral' }
  },
  test: {
    PENDING: { text: 'Chưa làm bài', tone: 'warning' },
    IN_PROGRESS: { text: 'Đang làm bài', tone: 'info' },
    PASSED: { text: 'Đạt yêu cầu', tone: 'success' },
    FAILED: { text: 'Chưa đạt', tone: 'danger' },
    EXPIRED: { text: 'Quá hạn nộp', tone: 'neutral' }
  },
  user: {
    ACTIVE: { text: 'Hoạt động', tone: 'success' },
    INACTIVE: { text: 'Không hoạt động', tone: 'neutral' },
    LOCKED: { text: 'Đã khóa', tone: 'danger' },
    PENDING: { text: 'Chờ kích hoạt', tone: 'warning' }
  },
  payment: {
    Paid: { text: 'Đã thanh toán', tone: 'success' },
    Unpaid: { text: 'Chưa thanh toán', tone: 'danger' },
    Partial: { text: 'Thanh toán một phần', tone: 'warning' },
    Refunded: { text: 'Đã hoàn tiền', tone: 'neutral' },
    Completed: { text: 'Hoàn thành', tone: 'success' },
    Processing: { text: 'Đang xử lý', tone: 'info' },
    Draft: { text: 'Bản nháp', tone: 'neutral' },
    Save: { text: 'Đã lưu', tone: 'success' },
    Cancelled: { text: 'Đã hủy', tone: 'neutral' },
    PendingApproval: { text: 'Chờ duyệt', tone: 'warning' },
    Approved: { text: 'Đã duyệt', tone: 'info' },
    Rejected: { text: 'Từ chối', tone: 'danger' }
  },
  generic: {}
};

export function getStatusConfig(status: string, type: StatusContextType = 'generic'): StatusConfig {
  if (type !== 'generic' && STATUS_DICTIONARY[type]?.[status]) {
    return STATUS_DICTIONARY[type][status];
  }

  // Fallback: look across all dictionaries
  for (const dictKey of Object.keys(STATUS_DICTIONARY) as StatusContextType[]) {
    if (STATUS_DICTIONARY[dictKey][status]) {
      return STATUS_DICTIONARY[dictKey][status];
    }
  }

  // Default fallback for unknown status
  return {
    text: status,
    tone: 'neutral'
  };
}

export interface StatusBadgeProps {
  status: string;
  type?: StatusContextType;
  label?: string;
  tone?: StatusTone;
  size?: 'sm' | 'md';
  variant?: 'subtle' | 'outline' | 'dot';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'generic',
  label,
  tone,
  size = 'sm',
  variant = 'subtle',
  showDot = false,
  className = ''
}) => {
  const config = getStatusConfig(status, type);
  const resolvedTone = tone || config.tone;
  const displayText = label || config.text;

  const toneClass = {
    success: styles.toneSuccess,
    warning: styles.toneWarning,
    danger: styles.toneDanger,
    info: styles.toneInfo,
    neutral: styles.toneNeutral
  }[resolvedTone];

  const variantClass = {
    subtle: styles.variantSubtle,
    outline: styles.variantOutline,
    dot: styles.variantDot
  }[variant];

  const sizeClass = size === 'md' ? styles.sizeMd : styles.sizeSm;

  return (
    <span className={`${styles.badge} ${sizeClass} ${variantClass} ${toneClass} ${className}`}>
      {(showDot || variant === 'dot') && <span className={styles.dot} />}
      <span>{displayText}</span>
    </span>
  );
};

export default StatusBadge;
