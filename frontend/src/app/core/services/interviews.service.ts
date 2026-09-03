import api from './api.service';

export const interviewsService = {
  getInterviews: () => api.get('/interviews'),
  getInterviewById: (id: number) => api.get(`/interviews/${id}`),
  createInterview: (data: { applicationId: number; scheduledAt: string; location?: string; meetingLink?: string; notes?: string }) => api.post('/interviews', data),
  updateStatus: (id: number, status: string) => api.put(`/interviews/${id}/status`, { id, status }),
};
