export type TechnicalTestType = 'TECHNICAL' | 'LOGIC' | 'ENGLISH' | 'CODING' | 'SYSTEM_DESIGN' | 'TAKE_HOME';

export type TechnicalTestStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'EXPIRED';

export interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  category?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
}

export interface CandidateQuestion {
  id: number;
  question: string;
  options: string[];
  category?: string;
  difficulty: string;
}

export interface AssessmentTemplate {
  id: number;
  jobId: number;
  jobTitle: string;
  title: string;
  description?: string;
  testType: TechnicalTestType;
  durationMinutes: number;
  passingScore: number;
  totalQuestions: number;
  autoInviteOnApply: boolean;
  autoInviteOnScreening: boolean;
  isActive: boolean;
  questions: AssessmentQuestion[];
}

export interface TechnicalTestSummary {
  id: number;
  applicationId: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  jobId: number;
  jobTitle: string;
  title: string;
  testType: TechnicalTestType;
  durationMinutes: number;
  passingScore: number;
  totalQuestions: number;
  correctAnswersCount: number;
  score: number;
  status: TechnicalTestStatus;
  startTime?: string;
  submittedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CandidateTestView {
  testId: number;
  applicationId: number;
  jobTitle: string;
  companyName: string;
  title: string;
  testType: TechnicalTestType;
  durationMinutes: number;
  passingScore: number;
  totalQuestions: number;
  status: TechnicalTestStatus;
  startTime?: string;
  serverCurrentTime?: string;
  questions: CandidateQuestion[];
}

export interface SubmitAnswerItem {
  questionId: number;
  selectedOptionIndex: number; // 0, 1, 2, 3 (-1 nếu chưa chọn)
}

export interface SubmitTestResult {
  testId: number;
  applicationId: number;
  title: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  passingScore: number;
  isPassed: boolean;
  status: TechnicalTestStatus;
  applicationStatus: string;
  message: string;
  submittedAt: string;
}

export interface AssessmentQuestionReview {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  candidateSelectedOptionIndex?: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface TestDetailResult {
  testId: number;
  applicationId: number;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  title: string;
  testType: TechnicalTestType;
  durationMinutes: number;
  passingScore: number;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  status: TechnicalTestStatus;
  startTime?: string;
  submittedAt?: string;
  questionReviews: AssessmentQuestionReview[];
}
