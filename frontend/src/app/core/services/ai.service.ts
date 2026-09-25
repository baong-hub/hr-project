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
  suggestedSalaryFrom?: number;
  suggestedSalaryTo?: number;
  salaryReason?: string;
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

export interface JobRecommendationResult {
  jobId: number;
  title: string;
  companyName: string;
  companyLogo?: string;
  city?: string;
  salaryFrom?: number;
  salaryTo?: number;
  matchScore: number;
  matchReason: string;
  matchingSkills: string[];
}

export interface CandidateRankResult {
  applicationId: number;
  candidateId: number;
  candidateName: string;
  candidateEmail?: string;
  candidateAvatar?: string;
  rank: number;
  matchScore: number;
  matchLevel: string;
  recommendation: string;
  strengths: string[];
  missingSkills: string[];
}

export const aiService = {
  analyzeJobFit: (jobId: number, candidateId?: number) =>
    api.post('/ai/analyze-job-fit', { jobId, candidateId }),

  /** Employer-side: phân tích mức độ phù hợp của ứng viên với JD */
  analyzeJobFitForEmployer: (jobId: number, candidateId: number) =>
    api.post('/ai/analyze-job-fit', { jobId, candidateId }),

  generateJd: (data: { title: string; keywords?: string }) =>
    api.post('/ai/generate-jd', data),

  chat: (data: { message: string; jobId?: number }) =>
    api.post('/ai/chat', data),

  /** AI sinh bộ câu hỏi phỏng vấn chuyên sâu theo JD + hồ sơ ứng viên */
  generateInterviewQuestions: (jobId: number, candidateId: number) =>
    api.post('/ai/generate-interview-questions', { jobId, candidateId }),

  /** Gợi ý việc làm cá nhân hóa cho ứng viên dựa trên hồ sơ & kỹ năng từ DB */
  getRecommendedJobs: (limit: number = 6) =>
    api.get('/ai/recommended-jobs', { params: { limit } }),

  /** AI tự động chấm điểm và xếp hạng danh sách ứng viên theo JD */
  rankCandidates: (jobId: number) =>
    api.post('/ai/rank-candidates', { jobId })
};

