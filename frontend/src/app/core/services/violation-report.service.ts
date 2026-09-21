import api from './api.service';

export interface ViolationReportDto {
  id: number;
  reporterUserId: number;
  reporterName?: string;
  reporterEmail?: string;
  jobId?: number;
  jobTitle?: string;
  companyId?: number;
  companyName?: string;
  reason: string;
  details?: string;
  status: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export const violationReportService = {
  createReport: async (data: { jobId?: number; companyId?: number; reason: string; details?: string }) => {
    const response = await api.post('/violation-reports', data);
    return response.data;
  },

  getReports: async (params?: { page?: number; pageSize?: number; status?: string; reason?: string }) => {
    const response = await api.get('/violation-reports', { params });
    return response.data;
  },

  resolveReport: async (id: number, resolutionNotes: string) => {
    const response = await api.post(`/violation-reports/${id}/resolve`, { resolutionNotes });
    return response.data;
  }
};
