import type { AxiosResponse } from 'axios';
import api from './api.service';
import type { ApiResponse, PagedResult } from '../models/api.model';
import type { JobDto, CreateJobDto, ChangeJobStatusDto } from '../models/job.model';

export const jobsService = {
  getJobs: (params?: any): Promise<AxiosResponse<ApiResponse<PagedResult<JobDto>>>> => 
    api.get('/jobs', { params }),
    
  getJobById: (id: number): Promise<AxiosResponse<ApiResponse<JobDto>>> => 
    api.get(`/jobs/${id}`),
    
  createJob: (data: CreateJobDto): Promise<AxiosResponse<ApiResponse<JobDto>>> => 
    api.post('/jobs', data),
    
  updateJob: (id: number, data: CreateJobDto): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    api.put(`/jobs/${id}`, { id, ...data }),
    
  deleteJob: (id: number): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    api.delete(`/jobs/${id}`),
    
  updateJobStatus: (id: number, data: ChangeJobStatusDto): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    api.patch(`/jobs/${id}/status`, { id, ...data }),
};
