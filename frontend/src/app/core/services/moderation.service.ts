import api from './api.service';
import type { Job } from '../models/job.model';

export interface FraudModerationDashboardData {
  totalJobsCount: number;
  flaggedRiskJobsCount: number;
  pendingReviewJobsCount: number;
  cleanJobsCount: number;
  pendingViolationReportsCount: number;
  resolvedViolationReportsCount: number;
  flaggedJobs: Job[];
  recentViolationReports: ViolationReportItem[];
}

export interface ViolationReportItem {
  id: number;
  reporterId: number;
  reporterName: string;
  targetType: string;
  targetId: number;
  targetTitle: string;
  reason: string;
  description?: string;
  status: string;
  resolution?: string;
  createdAt: string;
}

export interface ZaloZnsStatusData {
  isEnabled: boolean;
  isSimulationMode: boolean;
  oaId: string;
  appId: string;
  activeTemplatesCount: number;
  lastSentAt?: string;
  availableTemplates: {
    templateId: string;
    templateName: string;
    description: string;
    requiredParams: string[];
  }[];
}

export interface ZnsTestSendResult {
  success: boolean;
  messageId?: string;
  errorCode: number;
  errorMessage?: string;
  mode: string;
  recipientPhone: string;
  templateId: string;
  sentAt: string;
}

export const moderationService = {
  getDashboard: async (): Promise<FraudModerationDashboardData> => {
    const res = await api.get('/jobs/moderation-dashboard');
    return res.data?.data;
  },

  moderateJob: async (jobId: number, action: 'APPROVE' | 'REJECT_LOCK' | 'FLAG_RISK', note?: string): Promise<boolean> => {
    const res = await api.post(`/jobs/${jobId}/moderate`, { action, note });
    return res.data?.data;
  },

  resolveReport: async (reportId: number, resolution: string, hideTarget: boolean = false): Promise<boolean> => {
    const res = await api.post(`/violation-reports/${reportId}/resolve`, {
      resolution,
      status: 'RESOLVED',
      hideTarget
    });
    return res.data?.data;
  },

  getZaloStatus: async (): Promise<ZaloZnsStatusData> => {
    const res = await api.get('/zalo/status');
    return res.data?.data;
  },

  testSendZns: async (phoneNumber: string, templateId?: string, templateData?: Record<string, string>): Promise<ZnsTestSendResult> => {
    const res = await api.post('/zalo/test-send', { phoneNumber, templateId, templateData });
    return res.data?.data;
  }
};
