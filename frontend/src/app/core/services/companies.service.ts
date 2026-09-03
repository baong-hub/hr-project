import type { AxiosResponse } from 'axios';
import api from './api.service';
import type { ApiResponse, PagedResult } from '../models/api.model';
import type { CompanyDto, UpdateCompanyDto, FollowResultDto } from '../models/company.model';

export const companiesService = {
  getCompanies: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    industry?: string;
  }): Promise<AxiosResponse<ApiResponse<PagedResult<CompanyDto>>>> =>
    api.get('/companies', { params }),

  getCompanyById: (id: number): Promise<AxiosResponse<ApiResponse<CompanyDto>>> =>
    api.get(`/companies/${id}`),

  updateCompany: (id: number, data: UpdateCompanyDto): Promise<AxiosResponse<ApiResponse<CompanyDto>>> =>
    api.put(`/companies/${id}`, { id, ...data }),

  followCompany: (id: number): Promise<AxiosResponse<ApiResponse<FollowResultDto>>> =>
    api.post(`/companies/${id}/follow`),
};
