export type JobOfferStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'NEGOTIATING'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export type OfferSalaryType = 'GROSS' | 'NET';

export interface JobOffer {
  id: number;
  applicationId: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;

  positionTitle: string;
  departmentName?: string;
  workLocation?: string;
  workingHours?: string;

  basicSalary: number;
  allowance: number;
  totalSalary: number;
  salaryType: OfferSalaryType;
  currency: string;

  probationPeriodMonths: number;
  probationSalaryPercentage: number;
  probationSalary: number;

  startDate: string;
  expiryDate: string;
  issuedAt: string;
  respondedAt?: string;

  benefits?: string;
  specialTerms?: string;
  notes?: string;

  offerLetterFileUrl?: string;
  offerLetterFileName?: string;

  status: JobOfferStatus;
  candidateResponseNote?: string;
  candidateDesiredSalary?: number;
  declineReason?: string;
  isExpired: boolean;
}

export interface CreateJobOfferRequest {
  applicationId: number;
  candidateEmail?: string;
  positionTitle: string;
  departmentName?: string;
  workLocation?: string;
  workingHours?: string;

  basicSalary: number;
  allowance: number;
  salaryType: OfferSalaryType;
  currency?: string;

  probationPeriodMonths: number;
  probationSalaryPercentage: number;

  startDate: string;
  expiryDate: string;

  benefits?: string;
  specialTerms?: string;
  notes?: string;

  offerLetterFileUrl?: string;
  offerLetterFileName?: string;
}

export interface RespondJobOfferRequest {
  action: 'ACCEPT' | 'NEGOTIATE' | 'DECLINE';
  desiredSalary?: number;
  note?: string;
  declineReason?: string;
}

export interface CancelJobOfferRequest {
  reason?: string;
}
