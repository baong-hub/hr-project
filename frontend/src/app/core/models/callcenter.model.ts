import type { PagedResult } from './api.model';

export interface CallCenterSetting {
  apiKey: string;
  extensionDomain: string;
  websocketAddress: string;
  tokenUrl: string;
  cdrRetrievalUrl: string;
  autoClosePopup: boolean;
  enableWrapUp: boolean;
  wrapUpDurationSeconds: number;
  enableMissedCallTask: boolean;
  missedCallTaskAssigneeRole: string | null;
  enableRecallReminder: boolean;
  recallAdvanceMinutes: number;
  fallbackRoutingStrategy: 'RoundRobin' | 'Queue' | 'Extension';
  fallbackRoutingDestination: string | null;
  enablePitelWebhook?: boolean;
  pitelSecretKey?: string | null;
  minCallDurationSeconds?: number;
}

export interface UserExtension {
  id: number;
  extension: string;
  sipUsername: string;
  sipPassword: string;
  sipServer: string;
  wssUrl: string | null;
  currentStatus: string;
  pauseReason: string | null;
}

export interface CallLog {
  id: number;
  callId: string;
  direction: number; // 1: Inbound, 2: Outbound
  callerNumber: string;
  calleeNumber: string;
  extension: string | null;
  agentUserId: number | null;
  agentName: string;
  branchName?: string;
  leadId: number | null;
  leadName: string;
  customerId: number | null;
  customerName: string;
  callStatus: string;
  startTime: string | null;
  answerTime: string | null;
  endTime: string | null;
  durationSeconds: number;
  note: string | null;
  callOutcome: string | null;
  rating: number | null;
  audioUrl: string | null;
  isDownloaded: boolean;
  isKpiMet?: boolean;
  createdAt: string;
}

export interface CallHistoryParams {
  startTime?: string;
  endTime?: string;
  startHour?: string;
  endHour?: string;
  extension?: string;
  searchText?: string;
  callStatus?: string;
  callStatuses?: string[];
  rating?: number;
  maxRating?: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  careStaffId?: number;
  page?: number;
  pageSize?: number;
}

export interface CallHistoryKpi {
  totalCalls: number;
  totalInbound: number;
  totalOutbound: number;
  totalAnswered: number;
  totalMissed: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
}

export interface CallHistoryResult {
  callLogs: PagedResult<CallLog>;
  kpi: CallHistoryKpi;
}

export interface ActiveCall {
  callId: string;
  direction: number;
  callerNumber: string;
  calleeNumber: string;
  extension: string | null;
  agentName: string;
  customerName: string;
  leadId: number | null;
  customerId: number | null;
  durationSeconds: number;
  callStatus: string;
  startTime: string | null;
}

export interface AgentStatus {
  extension: string;
  currentStatus: string;
  pauseReason: string | null;
  statusChangedAt: string | null;
}

export interface CallKpiTarget {
  id?: number;
  targetType: number; // 1: CallTime, 2: CallCount
  scope: number; // 1: Individual, 2: Department
  targetId: number;
  targetName?: string;
  targetValue: number;
  period: number; // 1: Day, 2: Week, 3: Month
  isActive: boolean;
}

export interface CallKpiReportItem {
  name: string;
  targetTypeName: string;
  targetType: number;
  scope: number;
  targetId: number;
  targetValue: number;
  actualValue: number;
  completionRate: number;
  statusColor: 'red' | 'yellow' | 'green';
}
