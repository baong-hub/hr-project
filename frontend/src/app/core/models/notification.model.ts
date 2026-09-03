export interface Notification {
  id: number;
  title: string;
  content: string;
  notificationType: NotificationType;
  isRead: boolean;
  redirectUrl?: string;
  createdAt: string;
}

export type NotificationType = 'APPLICATION_STATUS' | 'INTERVIEW_INVITE' | 'JOB_ALERT';

export interface UnreadCount {
  count: number;
}
