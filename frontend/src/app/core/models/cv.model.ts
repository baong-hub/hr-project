export interface CandidateCvDto {
  id: number;
  candidateId: number;
  cvTitle: string;
  fileUrl?: string;
  isDefault: boolean;
  fileSizeBytes?: number;
  cvType: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfileDto {
  id: number;
  fullName: string;
  avatarUrl?: string;
  gender?: string;
  birthDate?: string;
  objective?: string;
  experienceSummary?: string;
  skills: string[];
  visibilityStatus: string;
  currentPosition?: string;
  currentCompany?: string;
  totalYearsExperience?: number;
  location?: string;
  defaultCvUrl?: string;
  defaultCvTitle?: string;
  email?: string;
  phoneNumber?: string;
}

export interface UpdateProfileDto {
  skills?: string;
  experienceSummary?: string;
  visibilityStatus: 'PUBLIC' | 'PRIVATE';
}

export interface SearchCandidatesParams {
  page?: number;
  pageSize?: number;
  skill?: string;
  search?: string;
  location?: string;
  level?: string;
  minYearsExp?: number;
  maxYearsExp?: number;
}

export interface InviteCandidateRequest {
  jobId: number;
  message?: string;
}
