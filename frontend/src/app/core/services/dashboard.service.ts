import api from './api.service';

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};
