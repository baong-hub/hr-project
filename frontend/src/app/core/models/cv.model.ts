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
  skills: string[];
  visibilityStatus: string;
}

export interface UpdateProfileDto {
  skills?: string;
  experienceSummary?: string;
  visibilityStatus: 'PUBLIC' | 'PRIVATE';
}
