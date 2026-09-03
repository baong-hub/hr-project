export interface JobDto {
  id: number;
  employerId: number;
  companyName: string;
  companyLogoUrl?: string;
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  salaryFrom?: number;
  salaryTo?: number;
  city: string;
  status: JobStatus;
  expiredAt: string;
  createdAt: string;
  
  department?: string;
  category?: string;
  employmentType?: string;
  country?: string;
  district?: string;
  office?: string;
  workMode?: string;
  salaryType?: string;
  experienceLevel?: string;
  experienceYearsMin?: number;
  education?: string;
  probationDuration?: string;
  openings?: number;
  hiredCount?: number;
}

export type JobStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'PAUSED' | 'REJECTED' | 'EXPIRED' | 'CLOSED';
export type WorkMode = 'ONSITE' | 'HYBRID' | 'REMOTE';
export type SalaryType = 'NEGOTIABLE' | 'RANGE' | 'FIXED';

export interface CreateJobDto {
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  salaryFrom?: number;
  salaryTo?: number;
  city: string;
  expiredAt: string; // YYYY-MM-DD
  
  department?: string;
  category?: string;
  employmentType?: string;
  country?: string;
  district?: string;
  office?: string;
  workMode?: string;
  salaryType?: string;
  experienceLevel?: string;
  experienceYearsMin?: number;
  education?: string;
  probationDuration?: string;
  openings?: number;
  status?: JobStatus;
}

export interface ChangeJobStatusDto {
  status: JobStatus;
  note?: string;
}
