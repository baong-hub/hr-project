import api from './api.service';

export interface CreateInterviewPayload {
  applicationId: number;
  startTime?: string;
  endTime?: string;
  interviewType?: string;
  locationOrLink?: string;
  notes?: string;
  // Flexible aliases
  scheduledAt?: string;
  location?: string;
  meetingLink?: string;
}

export interface CreateInterviewEvaluationPayload {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  experienceScore: number;
  cultureFitScore: number;
  salaryExpectationScore: number;
  result: 'PASS' | 'FAIL' | 'NEXT_ROUND';
  comments?: string;
}

export interface InterviewEvaluation {
  id: number;
  interviewId: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  experienceScore: number;
  cultureFitScore: number;
  salaryExpectationScore: number;
  overallScore: number;
  result: 'PASS' | 'FAIL' | 'NEXT_ROUND';
  comments?: string;
  createdAt: string;
}

export const interviewsService = {
  getInterviews: (params?: { page?: number; pageSize?: number; status?: string; search?: string }) => 
    api.get('/interviews', { params }),
  getInterviewById: (id: number) => 
    api.get(`/interviews/${id}`),
  createInterview: (data: CreateInterviewPayload) => {
    const startTime = data.startTime || data.scheduledAt || new Date().toISOString();
    const endTime = data.endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
    const interviewType = data.interviewType || (data.location === 'Online' || data.meetingLink ? 'ONLINE' : 'OFFLINE');
    const locationOrLink = data.locationOrLink || data.meetingLink || data.location || 'Online';

    return api.post('/interviews', {
      applicationId: data.applicationId,
      startTime,
      endTime,
      interviewType,
      locationOrLink,
      notes: data.notes,
      scheduledAt: startTime,
      location: locationOrLink,
      meetingLink: data.meetingLink
    });
  },
  updateStatus: (id: number, status: string, reason?: string) => 
    api.patch(`/interviews/${id}/status`, { status, reason }),
  respondInterview: (id: number, accept: boolean, reason?: string) => 
    api.patch(`/interviews/${id}/respond`, { accept, reason }),
  cancelInterview: (id: number) => 
    api.patch(`/interviews/${id}/cancel`),
  getEvaluations: (interviewId: number) =>
    api.get(`/interviews/${interviewId}/evaluations`),
  submitEvaluation: (interviewId: number, data: CreateInterviewEvaluationPayload) =>
    api.post(`/interviews/${interviewId}/evaluations`, data),
};
