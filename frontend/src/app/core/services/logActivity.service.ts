import api from './api.service';

export interface LogActivityChangeDto {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface LogActivityDto {
  id: number;
  action: string;
  createdBy: string;
  createdAt: string;
  moduleName: string;
  entityId: number | null;
  beforeValue: string | null;
  afterValue: string | null;
  entityCode: string | null;
  entityName: string | null;
  ipAddress: string | null;
  device: string | null;
  operatingSystem: string | null;
  browser: string | null;
  changes: LogActivityChangeDto[];
}

export interface PagedResult<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UserInteractionDto {
  userId: number | null;
  fullName: string;
  email: string;
  roleName: string;
  viewCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  totalCount: number;
}

export interface SubsystemTrendDto {
  subsystemName: string;
  moduleName: string;
  viewCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  totalCount: number;
  dailyTrend: number[];
}

export interface LogActivitiesStatsDto {
  totalCount: number;
  viewCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  userStats: UserInteractionDto[];
  subsystemTrends: SubsystemTrendDto[];
}

export interface LogReportParams {
  search?: string;
  moduleName?: string;
  action?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

import type { ApiResponse } from '../models/api.model';

export const logActivityService = {
  getLogReport: async (params: LogReportParams) => {
    const response = await api.get<ApiResponse<PagedResult<LogActivityDto>>>('/log-activities/report', { params });
    return response.data.data!;
  },

  getLogStats: async (days: number = 10, userId?: number) => {
    const response = await api.get<ApiResponse<LogActivitiesStatsDto>>('/log-activities/stats', {
      params: { days, userId }
    });
    return response.data.data!;
  },

  logout: async () => {
    const response = await api.post<ApiResponse<boolean>>('/auth/logout');
    return response.data.data!;
  },

  getUserPresenceTimeline: async (selectedUserId?: number, startDate?: string, endDate?: string) => {
    const response = await api.get<ApiResponse<UserPresenceTimelineDto>>('/log-activities/presence', {
      params: { selectedUserId, startDate, endDate }
    });
    return response.data.data!;
  }
};

export interface UserPresenceStatusDto {
  userId: number;
  fullName: string;
  email: string;
  roleName: string;
  extension: string | null;
  isOnline: boolean;
  currentTabCount: number;
  departmentId: number;
  departmentName: string;
  agentStatus: string;
  pauseReason: string | null;
}

export interface UserPresenceLogDto {
  id: number;
  loginTime: string;
  logoutTime: string | null;
  tabCount: number;
  currentTabCount: number;
  durationSeconds: number;
}

export interface UserPresenceTimelineDto {
  userStatuses: UserPresenceStatusDto[];
  selectedUserTimeline: UserPresenceLogDto[];
  totalOnlineHoursToday: number;
  hourlyMaxTabs: number[];
}
