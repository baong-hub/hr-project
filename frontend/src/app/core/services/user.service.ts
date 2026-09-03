import api from './api.service';

export const userService = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: number) => api.get(`/users/${id}`),
};
