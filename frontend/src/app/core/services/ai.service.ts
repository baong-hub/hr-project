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

export interface InterviewQuestion {
  question: string;
  purpose: string;
  difficulty: string; // Easy, Medium, Hard
  expectedAnswer: string;
}

export interface InterviewQuestionCategory {
  categoryName: string;
  icon: string;
  questions: InterviewQuestion[];
}

export interface InterviewQuestionsResult {
  jobTitle: string;
  candidateName: string;
  categories: InterviewQuestionCategory[];
}

export const aiService = {
  analyzeJobFit: (jobId: number) =>
    api.post('/ai/analyze-job-fit', { jobId }),

  /** Employer-side: phân tích mức độ phù hợp của ứng viên với JD */
  analyzeJobFitForEmployer: (jobId: number, candidateId: number) =>
    api.post('/ai/analyze-job-fit', { jobId, candidateId }),

  generateJd: (data: { title: string; keywords?: string }) =>
    api.post('/ai/generate-jd', data),

  chat: (data: { message: string; jobId?: number }) =>
    api.post('/ai/chat', data),

  /** AI sinh bộ câu hỏi phỏng vấn chuyên sâu theo JD + hồ sơ ứng viên */
  generateInterviewQuestions: (jobId: number, candidateId: number) =>
    api.post('/ai/generate-interview-questions', { jobId, candidateId })
};
