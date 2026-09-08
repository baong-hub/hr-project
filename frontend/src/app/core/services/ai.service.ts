import api from './api.service';

export interface JobFitAnalysisResult {
  matchScore: number;
  matchLevel: string;
  summary: string;
  strengths: string[];
  missingSkills: string[];
  recommendations: string[];
}

export interface GenerateJdResult {
  description: string;
  requirements: string;
  benefits: string;
}

export const aiService = {
  analyzeJobFit: (jobId: number) =>
    api.post('/ai/analyze-job-fit', { jobId }),

  generateJd: (data: { title: string; keywords?: string }) =>
    api.post('/ai/generate-jd', data),

  chat: (data: { message: string; jobId?: number }) =>
    api.post('/ai/chat', data)
};
