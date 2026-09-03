import api from '../../../core/services/api.service';
import type { ApiResponse, CreateUserDto, GetUsersParams, PagedResult, UpdateUserDto, User } from '../models/user.model';

const BASE_URL = '/users';

export const userService = {
  getAll: (params: GetUsersParams): Promise<ApiResponse<PagedResult<User>>> => {
    return api.get(BASE_URL, { params }).then(res => res.data);
  },

  getById: (id: number): Promise<ApiResponse<User>> => {
    return api.get(`${BASE_URL}/${id}`).then(res => res.data);
  },

  create: (data: CreateUserDto): Promise<ApiResponse<number>> => {
    return api.post(BASE_URL, data).then(res => res.data);
  },

  update: (id: number, data: UpdateUserDto): Promise<ApiResponse<any>> => {
    return api.put(`${BASE_URL}/${id}`, data).then(res => res.data);
  },

  delete: (id: number): Promise<ApiResponse<any>> => {
    return api.delete(`${BASE_URL}/${id}`).then(res => res.data);
  },

  resetPassword: (id: number, password: string): Promise<ApiResponse<any>> => {
    return api.put(`${BASE_URL}/${id}/reset-password`, { id, newPassword: password }).then(res => res.data);
  },

  getPassword: (id: number): Promise<ApiResponse<string>> => {
    return api.get(`${BASE_URL}/${id}/password`).then(res => res.data);
  },

  uploadAvatar: (id: number, file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`${BASE_URL}/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  }
};
