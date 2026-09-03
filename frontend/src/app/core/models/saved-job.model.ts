export interface SavedJobDto {
  jobId: number;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  salaryFrom?: number;
  salaryTo?: number;
  city: string;
  expiredAt: string;
  jobStatus: string; // Trạng thái tin gốc: PUBLISHED, EXPIRED, CLOSED
  savedAt: string;
}

export interface SaveToggleResult {
  jobId: number;
  isSaved: boolean;
}
