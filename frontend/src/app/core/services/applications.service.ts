import type { AxiosResponse } from 'axios';
import api from './api.service';
import type { ApiResponse, PagedResult } from '../models/api.model';
import type { ApplicationDto, SubmitApplicationDto } from '../models/application.model';

export const applicationsService = {
  getApplications: (params?: { page?: number; pageSize?: number; jobId?: number; keyword?: string; status?: string }): Promise<AxiosResponse<ApiResponse<PagedResult<ApplicationDto>>>> => 
    api.get('/applications', { params }),

  getApplicationById: (id: number): Promise<AxiosResponse<ApiResponse<ApplicationDto>>> => 
    api.get(`/applications/${id}`),

  submitApplication: (data: SubmitApplicationDto): Promise<AxiosResponse<ApiResponse<ApplicationDto>>> => 
    api.post('/applications', data),

  changeStatus: (id: number, status: string): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    api.patch(`/applications/${id}/status`, { status }),

  updateStatus: (id: number, status: string): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    api.patch(`/applications/${id}/status`, { status }),
};
