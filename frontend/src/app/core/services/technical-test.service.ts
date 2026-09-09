import api from './api.service';
import type {
  AssessmentTemplate,
  AssessmentQuestion,
  CandidateTestView,
  SubmitAnswerItem,
  SubmitTestResult,
  TestDetailResult,
  TechnicalTestSummary
} from '../models/technical-test.model';

export const technicalTestService = {
  /** Lưu / Cập nhật đề thi cho Job */
  saveTemplate: (data: {
    jobId: number;
    title: string;
    description?: string;
    testType: string;
    durationMinutes: number;
    passingScore: number;
    totalQuestions: number;
    autoInviteOnApply: boolean;
    autoInviteOnScreening: boolean;
    questions: AssessmentQuestion[];
  }) => api.post<AssessmentTemplate>('/technical-tests/template', data),

  /** Lấy đề thi mẫu theo Job */
  getTemplateByJob: (jobId: number) =>
    api.get<AssessmentTemplate | null>(`/technical-tests/template/${jobId}`),

  /** AI sinh bộ câu hỏi trắc nghiệm đề thi theo JD */
  generateAiQuestions: (data: {
    jobId: number;
    testType: string;
    totalQuestions: number;
  }) => api.post<AssessmentQuestion[]>('/technical-tests/generate-questions', data),

  /** Mời ứng viên làm bài kiểm tra */
  inviteCandidate: (data: {
    applicationId: number;
    durationMinutes?: number;
    passingScore?: number;
  }) => api.post<TechnicalTestSummary>('/technical-tests/invite', data),

  /** Lấy đề thi bảo mật cho ứng viên làm bài */
  getTestForCandidate: (testId: number) =>
    api.get<CandidateTestView>(`/technical-tests/${testId}/take`),

  /** Bắt đầu làm bài thi (ghi nhận StartTime và lấy thời gian đếm ngược) */
  startTest: (testId: number) =>
    api.post<{
      testId: number;
      startTime: string;
      expiresAt: string;
      durationMinutes: number;
      serverCurrentTime: string;
    }>(`/technical-tests/${testId}/start`),

  /** Nộp bài thi trực tuyến và nhận kết quả chấm điểm tự động */
  submitTest: (testId: number, answers: SubmitAnswerItem[]) =>
    api.post<SubmitTestResult>(`/technical-tests/${testId}/submit`, { answers }),

  /** Xem kết quả chi tiết bài thi */
  getTestResult: (testId: number) =>
    api.get<TestDetailResult>(`/technical-tests/${testId}/result`),

  /** Danh sách bài test của các ứng viên ứng tuyển vào 1 Job */
  getTestsByJob: (jobId: number) =>
    api.get<TechnicalTestSummary[]>(`/technical-tests/by-job/${jobId}`)
};
