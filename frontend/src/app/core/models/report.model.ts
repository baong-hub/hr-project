export interface TopJobSummary {
  jobId: number;
  title: string;
  views: number;
  applications: number;
  applyRate: number;
  status: string;
}

export interface EmployerSummary {
  totalActiveJobs: number;
  totalApplications: number;
  totalViews: number;
  averageApplyRate: number;
  totalInterviews?: number;
  completedInterviews?: number;
  totalOffers?: number;
  totalHired?: number;
  averageTimeToHireDays?: number;
  offerAcceptanceRate?: number;
  topJobs?: TopJobSummary[];
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface RecruitmentFunnel {
  stages: FunnelStage[];
}

export interface AdminSummary {
  totalCompanies: number;
  totalCandidates: number;
  totalJobs: number;
  totalApplications: number;
}
