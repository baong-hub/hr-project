import type { AxiosResponse } from 'axios';
import api from './api.service';
import type { ApiResponse } from '../models/api.model';
import type { SavedJobDto, SaveToggleResult } from '../models/saved-job.model';
import type { PagedResult } from '../models/api.model';

export const savedJobService = {
  toggleSave: (id: number): Promise<AxiosResponse<ApiResponse<SaveToggleResult>>> =>
    api.post(`/jobs/${id}/save`),

  getSavedJobs: (params?: { page?: number; pageSize?: number }): Promise<AxiosResponse<ApiResponse<PagedResult<SavedJobDto>>>> =>
    api.get('/jobs/saved', { params }),
};
