import api from '../../../core/services/api.service';

export interface MasterDataItem {
  id: number;
  type: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const masterDataService = {
  getAll: (type?: string) => api.get('/master-data', { params: type ? { type } : {} }),
  getTypes: () => api.get('/master-data/types'),
  getById: (id: number) => api.get(`/master-data/${id}`),
  create: (data: Partial<MasterDataItem>) => api.post('/master-data', data),
  update: (id: number, data: Partial<MasterDataItem>) => api.put(`/master-data/${id}`, data),
  delete: (id: number) => api.delete(`/master-data/${id}`)
};
