export interface ApplicationDto {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  candidateId: number;
  candidateName: string;
  candidateEmail?: string;
  candidateCvId: number;
  cvFileUrl: string;
  coverLetter?: string;
  status: string;
  appliedAt: string;
  matchScore?: number;
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
