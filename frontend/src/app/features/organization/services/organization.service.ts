import api from '../../../core/services/api.service';

export interface DepartmentItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  parentId?: number | null;
  managerUserId?: number | null;
  managerName?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: DepartmentItem[];
}

export const organizationService = {
  getAll: () => api.get('/departments'),
  getTree: () => api.get('/departments/tree'),
  getById: (id: number) => api.get(`/departments/${id}`),
  create: (data: Partial<DepartmentItem>) => api.post('/departments', data),
  update: (id: number, data: Partial<DepartmentItem>) => api.put(`/departments/${id}`, data),
  delete: (id: number) => api.delete(`/departments/${id}`)
};
