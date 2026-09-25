export interface ApplicationTimelineItemDto {
  title: string;
  description?: string;
  timestamp: string;
  type: string;
  actorName?: string;
}

export interface ApplicationDto {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  candidateId: number;
  candidateName: string;
  candidateAvatarUrl?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateCvId: number;
  cvFileUrl: string;
  coverLetter?: string;
  status: string;
  appliedAt: string;
  matchScore?: number;
  aiSummary?: string;
  aiStrengths?: string[];
  aiGaps?: string[];
  aiEvaluatedAt?: string;
  viewedAt?: string;
  timeline?: ApplicationTimelineItemDto[];
}

export type ApplicationStatus = 'APPLIED' | 'SCREENING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

export interface SubmitApplicationDto {
  jobId: number;
  candidateCvId: number;
  coverLetter?: string;
}

export interface ChangeApplicationStatusDto {
  status: string;
}
