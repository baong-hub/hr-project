import type { AxiosResponse } from 'axios';
import api from './api.service';
import type { ApiResponse } from '../models/api.model';
import type { EmployerSummary, RecruitmentFunnel, AdminSummary } from '../models/report.model';

export const reportService = {
  getEmployerSummary: (params?: { from?: string; to?: string }): Promise<AxiosResponse<ApiResponse<EmployerSummary>>> =>
    api.get('/reports/employer/summary', { params }),

  getEmployerFunnel: (params?: { from?: string; to?: string }): Promise<AxiosResponse<ApiResponse<RecruitmentFunnel>>> =>
    api.get('/reports/employer/funnel', { params }),

  getAdminSummary: (): Promise<AxiosResponse<ApiResponse<AdminSummary>>> =>
    api.get('/reports/admin/summary'),
};
